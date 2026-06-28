"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { atualizarRevisao } from "@/server/revisao";

export type FiltroTreino = {
  assuntoIds?: string[];
  nivel?: string; // "Facil" | "Medio" | "Dificil"
  status?: "todas" | "nunca" | "erradas" | "favoritas";
  quantidade: number;
};

export type AlternativaDTO = { id: string; texto: string; ordem: number };
export type QuestaoDTO = {
  id: string;
  enunciado: string;
  nivel: string;
  banca: string;
  assunto: string;
  subassunto: string | null;
  alternativas: AlternativaDTO[];
};

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  // Garante que o usuario do cookie ainda existe (evita erro de FK apos reset do banco).
  const existe = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!existe) {
    throw new Error("Sessao invalida. Saia e entre novamente para continuar.");
  }
  return session.user.id;
}

/** Monta a lista de questoes do treino conforme os filtros. */
export async function montarTreino(filtro: FiltroTreino): Promise<QuestaoDTO[]> {
  const userId = await getUserId();
  const quantidade = Math.min(Math.max(filtro.quantidade || 10, 1), 100);

  const where: Prisma.QuestaoWhereInput = {};
  if (filtro.assuntoIds && filtro.assuntoIds.length > 0) {
    where.assuntoId = { in: filtro.assuntoIds };
  }
  if (filtro.nivel) where.nivel = filtro.nivel;

  if (filtro.status === "nunca") {
    where.respostas = { none: { userId } };
  } else if (filtro.status === "erradas") {
    where.respostas = { some: { userId, acertou: false } };
  } else if (filtro.status === "favoritas") {
    where.favoritos = { some: { userId } };
  }

  // Oculta do proprio usuario as questoes que ELE reportou enquanto o reporte
  // nao for resolvido por um admin.
  where.reportes = { none: { userId, status: { not: "resolvido" } } };

  // Sorteia entre TODAS as questoes que batem com o filtro. Sem isso, o
  // `take` pegaria sempre as primeiras por data de criacao — e como o seed
  // insere as questoes agrupadas por assunto, um treino multi-tema acabaria
  // mostrando so o primeiro assunto selecionado.
  const ids = await prisma.questao.findMany({ where, select: { id: true } });
  const idsSorteados = embaralhar(ids.map((q) => q.id)).slice(0, quantidade);

  const questoes = await prisma.questao.findMany({
    where: { id: { in: idsSorteados } },
    include: {
      assunto: true,
      subassunto: true,
      alternativas: { orderBy: { ordem: "asc" } },
    },
  });
  // Mantem a ordem sorteada (o findMany acima nao garante ordem).
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const ordenadas = idsSorteados
    .map((id) => porId.get(id))
    .filter((q): q is (typeof questoes)[number] => q != null);

  return ordenadas.map((q) => ({
    id: q.id,
    enunciado: q.enunciado,
    nivel: q.nivel,
    banca: q.banca,
    assunto: q.assunto.nome,
    subassunto: q.subassunto?.nome ?? null,
    alternativas: q.alternativas.map((a) => ({ id: a.id, texto: a.texto, ordem: a.ordem })),
  }));
}

/** Fisher–Yates: embaralha uma copia do array sem mutar o original. */
function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export type ResultadoResposta = {
  acertou: boolean;
  alternativaCorretaId: string;
  explicacao: string;
  fonteLegal: string | null;
};

/** Registra a resposta, atualiza a fila de revisao espacada e devolve o gabarito. */
export async function responder(
  questaoId: string,
  alternativaId: string,
  tempo: number
): Promise<ResultadoResposta> {
  const userId = await getUserId();

  const questao = await prisma.questao.findUnique({
    where: { id: questaoId },
    include: { alternativas: true },
  });
  if (!questao) throw new Error("Questao nao encontrada");

  const escolhida = questao.alternativas.find((a) => a.id === alternativaId);
  if (!escolhida) throw new Error("Alternativa invalida");

  const correta = questao.alternativas.find((a) => a.correta);
  const acertou = !!escolhida.correta;

  await prisma.resposta.create({
    data: {
      userId,
      questaoId,
      alternativaId,
      acertou,
      tempo: Math.max(0, Math.min(tempo, 3600)),
    },
  });

  // Revisao espacada (estilo Anki)
  await atualizarRevisao(userId, questaoId, acertou);

  return {
    acertou,
    alternativaCorretaId: correta?.id ?? "",
    explicacao: questao.explicacao,
    fonteLegal: questao.fonteLegal,
  };
}

/** Alterna o status de favorito de uma questao. */
export async function alternarFavorito(questaoId: string): Promise<boolean> {
  const userId = await getUserId();
  const existente = await prisma.favorito.findUnique({
    where: { userId_questaoId: { userId, questaoId } },
  });
  if (existente) {
    await prisma.favorito.delete({ where: { id: existente.id } });
    return false;
  }
  await prisma.favorito.create({ data: { userId, questaoId } });
  return true;
}
