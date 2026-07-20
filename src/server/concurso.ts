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
 * Id do concurso atual: le o cookie; se ausente ou orfao, cai no primeiro
 * concurso (ordem).
 *
 * IMPORTANTE: validamos que o concurso do cookie ainda existe. Depois de um
 * reset/reseed do banco (que regenera os ids), um cookie antigo apontaria para
 * um concurso inexistente e o app ficaria sem conteudo ("nenhuma questao").
 * Nesse caso, ignoramos o cookie e usamos o primeiro concurso.
 *
 * NOTA: `cookies()` do next/headers pode lancar erro em Server Actions no
 * Next.js 16. Por isso o try-catch: se falhar, cai no findFirst como fallback.
 */
export async function getConcursoAtualId(): Promise<string | null> {
  let doCookie: string | undefined;
  try {
    doCookie = (await cookies()).get(COOKIE_CONCURSO)?.value;
  } catch (e) {
    console.warn("getConcursoAtualId: cookies() falhou, usando fallback BD:", e);
  }
  if (doCookie) {
    const existe = await prisma.concurso.findUnique({
      where: { id: doCookie },
      select: { id: true },
    });
    if (existe) return doCookie;
  }
  const primeiro = await prisma.concurso.findFirst({
    orderBy: { ordem: "asc" },
    select: { id: true },
  });
  return primeiro?.id ?? null;
}
