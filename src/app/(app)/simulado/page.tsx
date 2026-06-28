import { prisma } from "@/lib/prisma";
import { listarSimulados } from "@/server/simulado";
import { SimuladoClient } from "./simulado-client";

export const dynamic = "force-dynamic";

export default async function SimuladoPage() {
  const [assuntos, historico] = await Promise.all([
    prisma.assunto.findMany({
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true, _count: { select: { questoes: true } } },
    }),
    listarSimulados(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <SimuladoClient
        assuntos={assuntos.map((a) => ({ id: a.id, nome: a.nome, total: a._count.questoes }))}
        historico={historico}
      />
    </div>
  );
}
