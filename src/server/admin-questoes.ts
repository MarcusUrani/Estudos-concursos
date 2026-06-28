"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NIVEIS } from "@/lib/utils";

async function exigirAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Acesso restrito a administradores");
}

export type AlternativaEdicao = {
  id: string;
  texto: string;
  correta: boolean;
  ordem: number;
};

export type QuestaoEdicaoDTO = {
  id: string;
  enunciado: string;
  nivel: string;
  banca: string;
  explicacao: string;
  fonteLegal: string | null;
  assunto: string;
  subassunto: string | null;
  alternativas: AlternativaEdicao[];
};

/** Carrega uma questao completa para edicao (admin). */
export async function getQuestaoParaEdicao(questaoId: string): Promise<QuestaoEdicaoDTO | null> {
  await exigirAdmin();

  const q = await prisma.questao.findUnique({
    where: { id: questaoId },
    include: {
      assunto: { select: { nome: true } },
      subassunto: { select: { nome: true } },
      alternativas: { orderBy: { ordem: "asc" } },
    },
  });
  if (!q) return null;

  return {
    id: q.id,
    enunciado: q.enunciado,
    nivel: q.nivel,
    banca: q.banca,
    explicacao: q.explicacao,
    fonteLegal: q.fonteLegal,
    assunto: q.assunto.nome,
    subassunto: q.subassunto?.nome ?? null,
    alternativas: q.alternativas.map((a) => ({
      id: a.id,
      texto: a.texto,
      correta: a.correta,
      ordem: a.ordem,
    })),
  };
}

export type AtualizarQuestaoInput = {
  questaoId: string;
  enunciado: string;
  nivel: string;
  explicacao: string;
  fonteLegal?: string | null;
  alternativas: { id: string; texto: string; correta: boolean }[];
};

/** Salva as edicoes de uma questao (admin). */
export async function atualizarQuestao(input: AtualizarQuestaoInput): Promise<void> {
  await exigirAdmin();

  const enunciado = input.enunciado?.trim();
  const explicacao = input.explicacao?.trim();
  if (!enunciado) throw new Error("O enunciado nao pode ficar vazio.");
  if (!explicacao) throw new Error("A explicacao nao pode ficar vazia.");
  if (!NIVEIS.includes(input.nivel as (typeof NIVEIS)[number])) {
    throw new Error("Nivel invalido.");
  }

  const questao = await prisma.questao.findUnique({
    where: { id: input.questaoId },
    include: { alternativas: { select: { id: true } } },
  });
  if (!questao) throw new Error("Questao nao encontrada.");

  const idsValidos = new Set(questao.alternativas.map((a) => a.id));
  const alts = (input.alternativas ?? []).filter((a) => idsValidos.has(a.id));

  if (alts.length === 0) throw new Error("Alternativas invalidas.");
  if (alts.some((a) => !a.texto.trim())) {
    throw new Error("Nenhuma alternativa pode ficar vazia.");
  }
  if (alts.filter((a) => a.correta).length !== 1) {
    throw new Error("Marque exatamente uma alternativa como correta.");
  }

  const fonteLegal = input.fonteLegal?.trim() || null;

  await prisma.$transaction([
    prisma.questao.update({
      where: { id: input.questaoId },
      data: { enunciado, explicacao, nivel: input.nivel, fonteLegal },
    }),
    ...alts.map((a) =>
      prisma.alternativa.update({
        where: { id: a.id },
        data: { texto: a.texto.trim(), correta: a.correta },
      })
    ),
  ]);

  revalidatePath("/admin/reportes");
  revalidatePath(`/admin/questoes/${input.questaoId}`);
}
