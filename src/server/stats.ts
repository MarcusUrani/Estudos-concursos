import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";

export type DashboardStats = {
  nome: string;
  respondidas: number;
  acertos: number;
  percentualAcerto: number;
  tempoEstudoSegundos: number;
  porAssunto: { assunto: string; total: number; acertos: number; percentual: number }[];
  temasFortes: string[];
  temasFracos: string[];
  revisoesPendentes: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = session.user.id;
  const concursoId = await getConcursoAtualId();

  const [user, respostas, revisoesPendentes] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.resposta.findMany({
      where: { userId, questao: { concursoId } },
      include: { questao: { include: { assunto: true } } },
    }),
    prisma.revisao.count({
      where: { userId, proximaData: { lte: new Date() }, questao: { concursoId } },
    }),
  ]);

  const respondidas = respostas.length;
  const acertos = respostas.filter((r) => r.acertou).length;
  const tempoEstudoSegundos = respostas.reduce((acc, r) => acc + r.tempo, 0);
  const percentualAcerto = respondidas ? Math.round((acertos / respondidas) * 100) : 0;

  // Agrupa por assunto
  const mapa = new Map<string, { total: number; acertos: number }>();
  for (const r of respostas) {
    const nome = r.questao.assunto.nome;
    const cur = mapa.get(nome) ?? { total: 0, acertos: 0 };
    cur.total += 1;
    if (r.acertou) cur.acertos += 1;
    mapa.set(nome, cur);
  }

  const porAssunto = Array.from(mapa.entries())
    .map(([assunto, v]) => ({
      assunto,
      total: v.total,
      acertos: v.acertos,
      percentual: Math.round((v.acertos / v.total) * 100),
    }))
    .sort((a, b) => b.percentual - a.percentual);

  const comAmostra = porAssunto.filter((a) => a.total >= 2);
  const temasFortes = comAmostra.filter((a) => a.percentual >= 80).map((a) => a.assunto);
  const temasFracos = comAmostra
    .filter((a) => a.percentual < 60)
    .map((a) => a.assunto);

  return {
    nome: user?.nome ?? "Estudante",
    respondidas,
    acertos,
    percentualAcerto,
    tempoEstudoSegundos,
    porAssunto,
    temasFortes,
    temasFracos,
    revisoesPendentes,
  };
}
