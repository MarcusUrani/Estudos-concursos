import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";
import { TreinoClient } from "./treino-client";

export const dynamic = "force-dynamic";

export default async function TreinoPage() {
  const assuntos = await prisma.assunto.findMany({
    where: { concursoId: await getConcursoAtualId() },
    orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
    select: {
      id: true,
      nome: true,
      materia: { select: { nome: true } },
      _count: { select: { questoes: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <TreinoClient
        assuntos={assuntos.map((a) => ({
          id: a.id,
          nome: a.nome,
          total: a._count.questoes,
          materia: a.materia?.nome ?? "Outros",
        }))}
      />
    </div>
  );
}
