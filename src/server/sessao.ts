"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";

// Sessoes de estudo iniciadas mas nao concluidas (treino/simulado/flashcards).
// Guardamos o `estado` (JSON) para retomar, alem de indice/total para o resumo
// no dashboard. Uma por usuario+tipo+concurso — iniciar uma nova substitui a
// anterior incompleta.

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  return session.user.id;
}

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
export async function salvarSessao(input: {
  tipo: string;
  estado: string;
  indice: number;
  total: number;
}): Promise<void> {
  const userId = await getUserId();
  let concursoId: string | null = null;
  try {
    concursoId = await getConcursoAtualId();
  } catch (e) {
    console.error("salvarSessao: getConcursoAtualId falhou:", e);
  }
  if (!concursoId) return; // sem concurso selecionado nao ha o que salvar

  // Upsert atomico (evita corrida entre autosaves concorrentes). A unique
  // [userId, tipo, concursoId] garante uma sessao por modo/concurso — iniciar
  // uma nova apenas atualiza a mesma linha, "apagando" o estado anterior.
  try {
    await prisma.sessaoEmAndamento.upsert({
      where: { userId_tipo_concursoId: { userId, tipo: input.tipo, concursoId } },
      update: { estado: input.estado, indice: input.indice, total: input.total },
      create: {
        userId,
        concursoId,
        tipo: input.tipo,
        estado: input.estado,
        indice: input.indice,
        total: input.total,
      },
    });
  } catch (e) {
    console.error("salvarSessao: upsert em SessaoEmAndamento falhou:", e);
    throw new Error("Erro ao salvar sessão. O banco de dados pode estar desatualizado.");
  }
}

/** Recupera a sessao salva de um tipo (para retomar), ou null. */
export async function getSessao(tipo: string): Promise<SessaoSalva | null> {
  const userId = await getUserId();
  const concursoId = await getConcursoAtualId();
  const s = await prisma.sessaoEmAndamento.findFirst({
    where: { userId, tipo, concursoId },
    select: { estado: true, indice: true, total: true },
  });
  return s ?? null;
}

/** Remove a sessao em andamento de um tipo (ex.: ao concluir). */
export async function limparSessao(tipo: string): Promise<void> {
  const userId = await getUserId();
  const concursoId = await getConcursoAtualId();
  await prisma.sessaoEmAndamento.deleteMany({ where: { userId, tipo, concursoId } });
}

/** Lista as sessoes em andamento do concurso atual (para o dashboard). */
export async function listarSessoesEmAndamento(): Promise<SessaoResumo[]> {
  const userId = await getUserId();
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
