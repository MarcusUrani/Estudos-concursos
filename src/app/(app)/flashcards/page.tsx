import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";
import { getSessao } from "@/server/sessao";
import { FlashcardsClient } from "./flashcards-client";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ assunto?: string; retomar?: string }>;
}) {
  const { assunto, retomar } = await searchParams;

  const [assuntos, sessaoInicial] = await Promise.all([
    prisma.assunto.findMany({
      where: { concursoId: await getConcursoAtualId() },
      orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
      select: {
        id: true,
        nome: true,
        materia: { select: { nome: true } },
        _count: { select: { questoes: true } },
      },
    }),
    retomar ? getSessao("flashcards") : Promise.resolve(null),
  ]);

  return (
    <PaginaSessao>
      <Cabecalho
        titulo="Flashcards"
        descricao="Cards gerados automaticamente das questões. Veja a frente, tente lembrar e se auto-avalie — o que você não souber volta antes na revisão espaçada."
      />

      <FlashcardsClient
        assuntos={assuntos.map((a) => ({
          id: a.id,
          nome: a.nome,
          total: a._count.questoes,
          materia: a.materia?.nome ?? "Outros",
        }))}
        assuntosIniciais={assunto ? [assunto] : []}
        sessaoInicial={sessaoInicial}
      />
    </PaginaSessao>
  );
}
