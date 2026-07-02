"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { COOKIE_CONCURSO } from "@/server/concurso";

/** Troca o concurso atual (grava no cookie). So aceita ids validos. */
export async function selecionarConcurso(id: string): Promise<void> {
  const existe = await prisma.concurso.findUnique({ where: { id }, select: { id: true } });
  if (!existe) throw new Error("Concurso inválido");

  (await cookies()).set(COOKIE_CONCURSO, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
