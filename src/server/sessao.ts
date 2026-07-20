"use server";

import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";
import { requireUserId } from "@/server/usuario";

// Sessoes de estudo iniciadas mas nao concluidas (treino/simulado/flashcards).
// Guardamos o `estado` (JSON) para retomar, alem de indice/total para o resumo
// no dashboard. Uma por usuario+tipo+concurso — iniciar uma nova substitui a
// anterior incompleta.

export type SessaoResumo = {
  tipo: string;
  indice: number;
  total: number;
  atualizadaEm: string;
};

export type SessaoSalva = {
  estado: string;
  indice: number;
  total: number;
};

/** Salva/atualiza a sessao em andamento do tipo indicado (substitui a anterior). */
export async function salvarSessao(
  input: {
    tipo: string;
    estado: string;
    indice: number;
    total: number;
  },
  concursoId?: string | null
): Promise<void> {
  const userId = await requireUserId();
  const cid = concursoId !== undefined ? concursoId : await getConcursoAtualId();
  if (!cid) return;

  try {
    await prisma.sessaoEmAndamento.upsert({
      where: { userId_tipo_concursoId: { userId, tipo: input.tipo, concursoId: cid } },
      update: { estado: input.estado, indice: input.indice, total: input.total },
      create: {
        userId,
        concursoId: cid,
        tipo: input.tipo,
        estado: input.estado,
        indice: input.indice,
        total: input.total,
      },
    });
  } catch (e) {
    console.error("salvarSessao: upsert em SessaoEmAndamento falhou:", e);
    throw new Error("Erro ao salvar sessão.");
  }
}

/** Recupera a sessao salva de um tipo (para retomar), ou null. */
export async function getSessao(
  tipo: string,
  concursoId?: string | null
): Promise<SessaoSalva | null> {
  const userId = await requireUserId();
  const cid = concursoId !== undefined ? concursoId : await getConcursoAtualId();
  const s = await prisma.sessaoEmAndamento.findFirst({
    where: { userId, tipo, concursoId: cid },
    select: { estado: true, indice: true, total: true },
  });
  return s ?? null;
}

/** Remove a sessao em andamento de um tipo (ex.: ao concluir). */
export async function limparSessao(
  tipo: string,
  concursoId?: string | null
): Promise<void> {
  const userId = await requireUserId();
  const cid = concursoId !== undefined ? concursoId : await getConcursoAtualId();
  await prisma.sessaoEmAndamento.deleteMany({ where: { userId, tipo, concursoId: cid } });
}

/** Lista as sessoes em andamento do concurso atual (para o dashboard). */
export async function listarSessoesEmAndamento(): Promise<SessaoResumo[]> {
  const userId = await requireUserId();
  const concursoId = await getConcursoAtualId();
  const sessoes = await prisma.sessaoEmAndamento.findMany({
    where: { userId, concursoId },
    orderBy: { atualizadaEm: "desc" },
    select: { tipo: true, indice: true, total: true, atualizadaEm: true },
  });
  return sessoes.map((s) => ({
    tipo: s.tipo,
    indice: s.indice,
    total: s.total,
    atualizadaEm: s.atualizadaEm.toISOString(),
  }));
}
