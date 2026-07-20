"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { atualizarRevisao } from "@/server/revisao";
import { getConcursoAtualId } from "@/server/concurso";
import { requireUserId } from "@/server/usuario";

// Flashcards "automaticos": derivados das proprias questoes. Frente = enunciado;
// verso = alternativa correta + comentario + base legal. A auto-avaliacao
// ("sabia" / "nao sabia") alimenta a MESMA fila de revisao espacada das
// questoes (modelo Revisao), sem criar tabela nova.

export type FlashcardDTO = {
  questaoId: string;
  frente: string;
  verso: string;
  explicacao: string;
  fonteLegal: string | null;
  assunto: string;
  subassunto: string | null;
  nivel: string;
};


function embaralhar<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/**
 * Gera um baralho de flashcards. Se `assuntoId` for informado, limita ao
 * assunto; `vencidos` limita as questoes ja na fila de revisao para hoje.
 */
export async function gerarFlashcards(opts?: {
  assuntoIds?: string[];
  quantidade?: number;
  vencidos?: boolean;
}): Promise<FlashcardDTO[]> {
  const userId = await requireUserId();
  const quantidade = Math.min(Math.max(opts?.quantidade ?? 20, 1), 60);

  const where: Prisma.QuestaoWhereInput = { concursoId: await getConcursoAtualId() };
  if (opts?.assuntoIds && opts.assuntoIds.length > 0) {
    where.assuntoId = { in: opts.assuntoIds };
  }
  if (opts?.vencidos) {
    where.revisoes = { some: { userId, proximaData: { lte: new Date() } } };
  }
  // Oculta as questoes que o usuario reportou (reporte ainda nao resolvido).
  where.reportes = { none: { userId, status: { not: "resolvido" } } };

  const ids = await prisma.questao.findMany({ where, select: { id: true } });
  const sorteados = embaralhar(ids.map((q) => q.id)).slice(0, quantidade);

  const questoes = await prisma.questao.findMany({
    where: { id: { in: sorteados } },
    include: {
      assunto: true,
      subassunto: true,
      alternativas: { where: { correta: true }, take: 1 },
    },
  });

  const porId = new Map(questoes.map((q) => [q.id, q]));
  return sorteados
    .map((id) => porId.get(id))
    .filter((q): q is NonNullable<typeof q> => q != null)
    .map((q) => ({
      questaoId: q.id,
      frente: q.enunciado,
      verso: q.alternativas[0]?.texto ?? "—",
      explicacao: q.explicacao,
      fonteLegal: q.fonteLegal,
      assunto: q.assunto.nome,
      subassunto: q.subassunto?.nome ?? null,
      nivel: q.nivel,
    }));
}

/**
 * Auto-avaliacao de um flashcard. Reaproveita a fila de revisao espacada:
 * "sabia" avanca o intervalo; "nao sabia" volta ao inicio.
 */
export async function avaliarFlashcard(questaoId: string, sabia: boolean): Promise<void> {
  const userId = await requireUserId();
  await atualizarRevisao(userId, questaoId, sabia);
}
