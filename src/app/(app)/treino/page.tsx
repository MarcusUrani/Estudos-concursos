import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";
import { getSessao } from "@/server/sessao";
import { TreinoClient } from "./treino-client";

export const dynamic = "force-dynamic";

export default async function TreinoPage({
  searchParams,
}: {
  searchParams: Promise<{ retomar?: string }>;
}) {
  const { retomar } = await searchParams;

  // Resolve o concursoId UMA vez no Server Component e passa para o client,
  // evitando que as server actions precisem chamar cookies()/getConcursoAtualId.
  const concursoId = await getConcursoAtualId();

  const [assuntos, sessaoInicial] = await Promise.all([
    prisma.assunto.findMany({
      where: { concursoId },
      orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
      select: {
        id: true,
        nome: true,
        materia: { select: { nome: true } },
        _count: { select: { questoes: true } },
      },
    }),
    retomar ? getSessao("treino", concursoId) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <TreinoClient
        concursoId={concursoId}
        assuntos={assuntos.map((a) => ({
          id: a.id,
          nome: a.nome,
          total: a._count.questoes,
          materia: a.materia?.nome ?? "Outros",
        }))}
        sessaoInicial={sessaoInicial}
      />
    </div>
  );
}
