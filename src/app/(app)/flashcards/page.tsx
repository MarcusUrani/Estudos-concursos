import { prisma } from "@/lib/prisma";
import { FlashcardsClient } from "./flashcards-client";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ assunto?: string }>;
}) {
  const { assunto } = await searchParams;

  const assuntos = await prisma.assunto.findMany({
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true, _count: { select: { questoes: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Flashcards</h1>
        <p className="text-sm text-slate-400">
          Cards gerados automaticamente das questões. Veja a frente, tente lembrar e se auto-avalie —
          o que você não souber volta antes na revisão espaçada.
        </p>
      </header>

      <FlashcardsClient
        assuntos={assuntos.map((a) => ({ id: a.id, nome: a.nome, total: a._count.questoes }))}
        assuntosIniciais={assunto ? [assunto] : []}
      />
    </div>
  );
}
