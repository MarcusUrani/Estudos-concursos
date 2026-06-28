"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ehMotivoValido } from "@/lib/reportes";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  return session.user.id;
}

async function exigirAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Acesso restrito a administradores");
  return session.user.id!;
}

/**
 * Registra um reporte de uma questao. `motivos` e a lista de ids selecionados
 * (obrigatorio ter ao menos um); `comentario` e o texto livre opcional.
 */
export async function reportarQuestao(
  questaoId: string,
  motivos: string[],
  comentario?: string
): Promise<void> {
  const userId = await getUserId();

  const validos = (motivos ?? []).filter(ehMotivoValido);
  if (validos.length === 0) throw new Error("Selecione ao menos um motivo.");

  const questao = await prisma.questao.findUnique({
    where: { id: questaoId },
    select: { id: true },
  });
  if (!questao) throw new Error("Questao nao encontrada");

  const texto = comentario?.trim().slice(0, 1000) || null;

  await prisma.reporte.create({
    data: { userId, questaoId, motivos: validos.join(","), comentario: texto },
  });
}

export type ReporteDTO = {
  id: string;
  motivos: string[];
  comentario: string | null;
  status: string;
  criadoEm: string;
  reportadoPor: string;
  questao: {
    id: string;
    enunciado: string;
    assunto: string;
    subassunto: string | null;
  };
};

/** Lista os reportes (admin). Por padrao mostra os abertos primeiro. */
export async function listarReportes(): Promise<ReporteDTO[]> {
  await exigirAdmin();

  const reportes = await prisma.reporte.findMany({
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    take: 300,
    include: {
      user: { select: { nome: true, email: true } },
      questao: {
        select: {
          id: true,
          enunciado: true,
          assunto: { select: { nome: true } },
          subassunto: { select: { nome: true } },
        },
      },
    },
  });

  return reportes.map((r) => ({
    id: r.id,
    motivos: r.motivos.split(",").map((s) => s.trim()).filter(Boolean),
    comentario: r.comentario,
    status: r.status,
    criadoEm: r.criadoEm.toISOString(),
    reportadoPor: r.user.nome || r.user.email,
    questao: {
      id: r.questao.id,
      enunciado: r.questao.enunciado,
      assunto: r.questao.assunto.nome,
      subassunto: r.questao.subassunto?.nome ?? null,
    },
  }));
}

/** Alterna o status de um reporte entre "aberto" e "resolvido" (admin). */
export async function alternarStatusReporte(id: string): Promise<string> {
  await exigirAdmin();
  const atual = await prisma.reporte.findUnique({ where: { id }, select: { status: true } });
  if (!atual) throw new Error("Reporte nao encontrado");
  const novo = atual.status === "resolvido" ? "aberto" : "resolvido";
  await prisma.reporte.update({ where: { id }, data: { status: novo } });
  revalidatePath("/admin/reportes");
  return novo;
}
