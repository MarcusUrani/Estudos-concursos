import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Concurso atualmente selecionado. A escolha e guardada num cookie e usada por
// todas as consultas de conteudo para filtrar por concurso.
export const COOKIE_CONCURSO = "jade_concurso";

export type ConcursoDTO = { id: string; nome: string; sigla: string | null };

export async function listarConcursos(): Promise<ConcursoDTO[]> {
  return prisma.concurso.findMany({
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true, sigla: true },
  });
}

/**
 * Id do concurso atual: le o cookie; se ausente, cai no primeiro concurso
 * (ordem). A action `selecionarConcurso` so grava ids validos, entao confiamos
 * no cookie sem uma consulta extra no caminho comum.
 *
 * NOTA: `cookies()` do next/headers pode lancar erro em Server Actions no
 * Next.js 16. Por isso o try-catch: se falhar, cai no findFirst como fallback.
 */
export async function getConcursoAtualId(): Promise<string | null> {
  try {
    const doCookie = (await cookies()).get(COOKIE_CONCURSO)?.value;
    if (doCookie) return doCookie;
  } catch (e) {
    console.warn("getConcursoAtualId: cookies() falhou, usando fallback BD:", e);
  }
  const primeiro = await prisma.concurso.findFirst({
    orderBy: { ordem: "asc" },
    select: { id: true },
  });
  return primeiro?.id ?? null;
}
