"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/usuario";
import { MAX_RESUMO } from "@/lib/resumo";

/* =============================================================================
   Resumo do estudante

   O caderno da pessoa, um por assunto. Nao se confunde com `Assunto.resumo`,
   que e o material do admin e igual para todo mundo — este e privado, e toda
   consulta filtra por userId.

   Escrever de novo ATUALIZA o que existe, nao empilha versao: e o que "poder
   atualizar conforme quiser" quer dizer, e e por isso que a chave e
   (usuario, assunto) e a gravacao e um upsert.
   ============================================================================= */

export type ResumoPessoalDTO = {
  texto: string;
  atualizadoEm: string;
};

/* Erro como VALOR, pela mesma razao de `server/redacao.ts`: em producao o Next
   apaga a mensagem de erro lancado numa server action e devolve 500 sem
   detalhe. Aqui isso seria pior que em outros lugares — a pessoa acabou de
   escrever um texto longo e precisa saber se ele foi salvo. */
export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

export async function getResumoPessoal(assuntoId: string): Promise<ResumoPessoalDTO | null> {
  const userId = await requireUserId();
  const r = await prisma.resumoPessoal.findUnique({
    where: { userId_assuntoId: { userId, assuntoId } },
    select: { texto: true, atualizadoEm: true },
  });
  return r ? { texto: r.texto, atualizadoEm: r.atualizadoEm.toISOString() } : null;
}

export async function salvarResumoPessoal(input: {
  assuntoId: string;
  texto: string;
}): Promise<Resultado<ResumoPessoalDTO>> {
  try {
    const userId = await requireUserId();
    const texto = input.texto?.trim() ?? "";

    if (!texto) throw new Error("Escreva alguma coisa antes de salvar.");
    if (texto.length > MAX_RESUMO) {
      throw new Error(`O resumo passa de ${MAX_RESUMO.toLocaleString("pt-BR")} caracteres.`);
    }

    // O assunto precisa existir: sem isso um id qualquer criaria linha orfa.
    const assunto = await prisma.assunto.findUnique({
      where: { id: input.assuntoId },
      select: { id: true },
    });
    if (!assunto) throw new Error("Tema não encontrado.");

    const salvo = await prisma.resumoPessoal.upsert({
      where: { userId_assuntoId: { userId, assuntoId: assunto.id } },
      create: { userId, assuntoId: assunto.id, texto },
      update: { texto },
      select: { texto: true, atualizadoEm: true },
    });

    revalidatePath(`/estudar/${assunto.id}`);
    revalidatePath("/estudar");
    return {
      ok: true,
      dados: { texto: salvo.texto, atualizadoEm: salvo.atualizadoEm.toISOString() },
    };
  } catch (e) {
    console.error("[resumo-pessoal] salvar:", e);
    return {
      ok: false,
      erro: e instanceof Error && e.message ? e.message : "Não foi possível salvar o resumo.",
    };
  }
}

export async function excluirResumoPessoal(assuntoId: string): Promise<Resultado<null>> {
  try {
    const userId = await requireUserId();
    // deleteMany e nao delete: apagar o que ja nao existe nao e erro, e o
    // `delete` lancaria. Alem disso o filtro por userId fica explicito aqui.
    await prisma.resumoPessoal.deleteMany({ where: { userId, assuntoId } });

    revalidatePath(`/estudar/${assuntoId}`);
    revalidatePath("/estudar");
    return { ok: true, dados: null };
  } catch (e) {
    console.error("[resumo-pessoal] excluir:", e);
    return { ok: false, erro: "Não foi possível excluir o resumo." };
  }
}
