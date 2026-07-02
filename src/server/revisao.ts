import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { INTERVALOS_REVISAO } from "@/lib/utils";
import { getConcursoAtualId } from "@/server/concurso";

/**
 * Atualiza a fila de revisao espacada (estilo Anki) apos uma resposta.
 * Acertou: avanca o nivel (intervalo maior). Errou: volta para o inicio.
 * Helper compartilhado por treino.ts e simulado.ts.
 */
export async function atualizarRevisao(userId: string, questaoId: string, acertou: boolean) {
  const existente = await prisma.revisao.findUnique({
    where: { userId_questaoId: { userId, questaoId } },
  });

  const nivelAtual = existente?.nivel ?? 0;
  const novoNivel = acertou ? Math.min(nivelAtual + 1, INTERVALOS_REVISAO.length - 1) : 0;
  const dias = INTERVALOS_REVISAO[novoNivel];
  const proximaData = new Date();
  proximaData.setDate(proximaData.getDate() + dias);

  await prisma.revisao.upsert({
    where: { userId_questaoId: { userId, questaoId } },
    create: { userId, questaoId, nivel: novoNivel, proximaData },
    update: { nivel: novoNivel, proximaData },
  });
}

export type AlternativaRevisaoDTO = {
  id: string;
  texto: string;
  ordem: number;
  correta: boolean;
};

// DTO "rico": inclui gabarito e explicacao para o modo de visualizacao.
export type QuestaoRevisaoDTO = {
  id: string;
  enunciado: string;
  nivel: string;
  banca: string;
  assunto: string;
  subassunto: string | null;
  alternativas: AlternativaRevisaoDTO[];
  explicacao: string;
  fonteLegal: string | null;
};

export type ListaRevisao = {
  questoes: QuestaoRevisaoDTO[];
  favoritos: string[]; // ids de questoes favoritadas (para marcar a estrela)
};

/**
 * Fila de revisao espacada VENCIDA (estilo Anki): questoes cuja `proximaData`
 * ja chegou. E o que alimenta a pagina /revisao. Responder por la (via
 * `responder`) reagenda a proxima data automaticamente.
 */
export async function listarRevisaoDoDia(): Promise<ListaRevisao> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = session.user.id;

  const [revisoes, favoritos] = await Promise.all([
    prisma.revisao.findMany({
      where: {
        userId,
        proximaData: { lte: new Date() },
        // Apenas do concurso atual + oculta as questoes reportadas (nao resolvidas).
        questao: {
          concursoId: await getConcursoAtualId(),
          reportes: { none: { userId, status: { not: "resolvido" } } },
        },
      },
      orderBy: { proximaData: "asc" },
      take: 50,
      include: {
        questao: {
          include: {
            assunto: true,
            subassunto: true,
            alternativas: { orderBy: { ordem: "asc" } },
          },
        },
      },
    }),
    prisma.favorito.findMany({ where: { userId }, select: { questaoId: true } }),
  ]);

  return {
    questoes: revisoes.map((r) => ({
      id: r.questao.id,
      enunciado: r.questao.enunciado,
      nivel: r.questao.nivel,
      banca: r.questao.banca,
      assunto: r.questao.assunto.nome,
      subassunto: r.questao.subassunto?.nome ?? null,
      explicacao: r.questao.explicacao,
      fonteLegal: r.questao.fonteLegal,
      alternativas: r.questao.alternativas.map((a) => ({
        id: a.id,
        texto: a.texto,
        ordem: a.ordem,
        correta: a.correta,
      })),
    })),
    favoritos: favoritos.map((f) => f.questaoId),
  };
}

/** Lista as questoes favoritas ou as que o usuario ja errou (para revisar). */
export async function listarRevisao(
  status: "favoritas" | "erradas"
): Promise<ListaRevisao> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = session.user.id;

  // Do concurso atual + oculta as questoes reportadas (ainda nao resolvidas).
  const base = {
    concursoId: await getConcursoAtualId(),
    reportes: { none: { userId, status: { not: "resolvido" } } },
  };
  const where =
    status === "favoritas"
      ? { favoritos: { some: { userId } }, ...base }
      : { respostas: { some: { userId, acertou: false } }, ...base };

  const [questoes, favoritos] = await Promise.all([
    prisma.questao.findMany({
      where,
      include: {
        assunto: true,
        subassunto: true,
        alternativas: { orderBy: { ordem: "asc" } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.favorito.findMany({ where: { userId }, select: { questaoId: true } }),
  ]);

  return {
    questoes: questoes.map((q) => ({
      id: q.id,
      enunciado: q.enunciado,
      nivel: q.nivel,
      banca: q.banca,
      assunto: q.assunto.nome,
      subassunto: q.subassunto?.nome ?? null,
      explicacao: q.explicacao,
      fonteLegal: q.fonteLegal,
      alternativas: q.alternativas.map((a) => ({
        id: a.id,
        texto: a.texto,
        ordem: a.ordem,
        correta: a.correta,
      })),
    })),
    favoritos: favoritos.map((f) => f.questaoId),
  };
}
