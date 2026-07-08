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
    retomar ? getSessao("treino") : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <TreinoClient
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
