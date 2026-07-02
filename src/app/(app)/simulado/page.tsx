import { prisma } from "@/lib/prisma";
import { listarSimulados } from "@/server/simulado";
import { getConcursoAtualId } from "@/server/concurso";
import { SimuladoClient } from "./simulado-client";

export const dynamic = "force-dynamic";

export default async function SimuladoPage() {
  const [assuntos, historico] = await Promise.all([
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
    listarSimulados(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <SimuladoClient
        assuntos={assuntos.map((a) => ({
          id: a.id,
          nome: a.nome,
          total: a._count.questoes,
          materia: a.materia?.nome ?? "Outros",
        }))}
        historico={historico}
      />
    </div>
  );
}
