import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type HistoricoItem = {
  id: string;
  questaoId: string;
  enunciado: string;
  assunto: string;
  nivel: string;
  acertou: boolean;
  tempo: number; // segundos
  respondidaEm: string; // ISO
  respostaTexto: string; // alternativa escolhida
  corretaTexto: string; // alternativa correta
};

export type Historico = {
  itens: HistoricoItem[];
  assuntos: string[]; // assuntos distintos presentes no historico (para o filtro)
};

// Limite generoso: o filtro/agrupamento e feito no cliente para dar resposta instantanea.
const LIMITE = 300;

/** Lista o historico de respostas do usuario, da mais recente para a mais antiga. */
export async function listarHistorico(): Promise<Historico> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = session.user.id;

  const respostas = await prisma.resposta.findMany({
    where: { userId },
    orderBy: { respondidaEm: "desc" },
    take: LIMITE,
    include: {
      alternativa: { select: { texto: true } },
      questao: {
        select: {
          id: true,
          enunciado: true,
          nivel: true,
          assunto: { select: { nome: true } },
          alternativas: {
            where: { correta: true },
            select: { texto: true },
            take: 1,
          },
        },
      },
    },
  });

  const itens: HistoricoItem[] = respostas.map((r) => ({
    id: r.id,
    questaoId: r.questaoId,
    enunciado: r.questao.enunciado,
    assunto: r.questao.assunto.nome,
    nivel: r.questao.nivel,
    acertou: r.acertou,
    tempo: r.tempo,
    respondidaEm: r.respondidaEm.toISOString(),
    respostaTexto: r.alternativa.texto,
    corretaTexto: r.questao.alternativas[0]?.texto ?? "",
  }));

  const assuntos = Array.from(new Set(itens.map((i) => i.assunto))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  return { itens, assuntos };
}
