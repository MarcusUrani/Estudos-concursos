"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/* =============================================================================
   Conteudo aberto a qualquer usuario autenticado

   Materia, assunto e geracao por IA ficam aqui; cadastro manual de questao,
   import em lote e material de estudo continuam sendo coisa de admin, em
   `admin-conteudo.ts`.

   ATENCAO ao alterar: o conteudo e COMPARTILHADO. A `Questao` (e a `Materia`, e
   o `Assunto`) nao tem dono — o recorte e por concurso, nao por pessoa. O que
   um usuario cria aqui aparece no treino de todos os outros que estudam o mesmo
   concurso. Nao existe rascunho privado.

   Diferente do resto do app, estas acoes NAO usam o concurso do cookie: o
   formulario escolhe o concurso explicitamente, entao ele vem por parametro e
   e validado contra o banco.
   ============================================================================= */

async function exigirUsuario(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Você precisa estar autenticada.");
  return session.user.id;
}

/** Confere que o concurso existe e devolve o id — nunca confie no que veio da tela. */
async function exigirConcurso(concursoId: string): Promise<string> {
  const c = await prisma.concurso.findUnique({ where: { id: concursoId }, select: { id: true } });
  if (!c) throw new Error("Selecione um concurso válido.");
  return c.id;
}

// ---------------------------------------------------------------- listagem

export type AssuntoArvore = { id: string; nome: string; materiaId: string | null };
export type MateriaArvore = { id: string; nome: string };
export type ConcursoArvore = {
  id: string;
  nome: string;
  materias: MateriaArvore[];
  assuntos: AssuntoArvore[];
};

/** Arvore completa concurso > materia > assunto, para popular os seletores. */
export async function listarArvoreConteudo(): Promise<ConcursoArvore[]> {
  await exigirUsuario();

  return prisma.concurso.findMany({
    orderBy: { ordem: "asc" },
    select: {
      id: true,
      nome: true,
      materias: { orderBy: { ordem: "asc" }, select: { id: true, nome: true } },
      assuntos: {
        orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
        select: { id: true, nome: true, materiaId: true },
      },
    },
  });
}

// ---------------------------------------------------------------- materia

export async function criarMateria(input: {
  concursoId: string;
  nome: string;
  descricao?: string;
}): Promise<void> {
  await exigirUsuario();
  const concursoId = await exigirConcurso(input.concursoId);

  const nome = input.nome?.trim();
  if (!nome) throw new Error("Informe o nome da matéria.");

  const existe = await prisma.materia.findFirst({
    where: { concursoId, nome },
    select: { id: true },
  });
  if (existe) throw new Error("Já existe uma matéria com esse nome neste concurso.");

  const ordem = await prisma.materia.count({ where: { concursoId } });
  await prisma.materia.create({
    data: { nome, descricao: input.descricao?.trim() || null, ordem, concursoId },
  });

  revalidatePath("/conteudo");
  revalidatePath("/estudar");
}

// ---------------------------------------------------------------- assunto

export async function criarAssunto(input: {
  concursoId: string;
  materiaId: string;
  nome: string;
  descricao?: string;
}): Promise<void> {
  await exigirUsuario();
  const concursoId = await exigirConcurso(input.concursoId);

  const nome = input.nome?.trim();
  if (!nome) throw new Error("Informe o nome do assunto.");

  // A materia precisa ser DO concurso escolhido: sem esta checagem daria para
  // pendurar um assunto de um concurso na materia de outro.
  const materia = await prisma.materia.findFirst({
    where: { id: input.materiaId, concursoId },
    select: { id: true },
  });
  if (!materia) throw new Error("Selecione uma matéria válida para este concurso.");

  const existe = await prisma.assunto.findFirst({
    where: { concursoId, nome },
    select: { id: true },
  });
  if (existe) throw new Error("Já existe um assunto com esse nome neste concurso.");

  const ordem = await prisma.assunto.count({ where: { concursoId } });
  await prisma.assunto.create({
    data: {
      nome,
      descricao: input.descricao?.trim() || null,
      ordem,
      materiaId: materia.id,
      concursoId,
    },
  });

  revalidatePath("/conteudo");
  revalidatePath("/estudar");
}
