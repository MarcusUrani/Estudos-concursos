import { prisma } from "@/lib/prisma";
import { listarSimulados } from "@/server/simulado";
import { getConcursoAtualId } from "@/server/concurso";
import { getSessao } from "@/server/sessao";
import { SimuladoClient } from "./simulado-client";

export const dynamic = "force-dynamic";

export default async function SimuladoPage({
  searchParams,
}: {
  searchParams: Promise<{ retomar?: string }>;
}) {
  const { retomar } = await searchParams;

  const [assuntos, historico, sessaoInicial] = await Promise.all([
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
    retomar ? getSessao("simulado") : Promise.resolve(null),
  ]);

  // Sem container: o SimuladoClient escolhe a largura por fase — formulario e
  // resultado em coluna de medida, prova em coluna + trilho com relogio.
  return (
    <SimuladoClient
      assuntos={assuntos.map((a) => ({
        id: a.id,
        nome: a.nome,
        total: a._count.questoes,
        materia: a.materia?.nome ?? "Outros",
      }))}
      historico={historico}
      sessaoInicial={sessaoInicial}
    />
  );
}
