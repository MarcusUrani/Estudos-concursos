import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Id do usuario logado, garantindo que ele ainda existe no banco.
 *
 * Se a sessao (JWT no cookie) apontar para um usuario que nao existe mais —
 * tipico depois de um reset/reseed do banco, que regenera os ids — em vez de
 * estourar um 500 ("Sessao invalida"), redireciona para /login. Ao entrar de
 * novo, um JWT novo (com o id atual) e emitido e tudo volta a funcionar.
 *
 * Centraliza a checagem que antes estava duplicada em cada server action.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const existe = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existe) redirect("/login?sessao=expirada");

  return userId;
}
