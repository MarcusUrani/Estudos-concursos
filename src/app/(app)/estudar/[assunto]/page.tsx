import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLegislacao } from "@/server/legislacao";
import { montarTreino } from "@/server/treino";
import { EstudarClient } from "./estudar-client";

export const dynamic = "force-dynamic";

export default async function LegislacaoPage({
  params,
}: {
  params: Promise<{ assunto: string }>;
}) {
  const { assunto: assuntoId } = await params;

  const detalhe = await getLegislacao(assuntoId);
  if (!detalhe) notFound();

  // Questoes relacionadas para praticar dentro da propria leitura.
  const relacionadas = await montarTreino({
    assuntoIds: [assuntoId],
    status: "todas",
    quantidade: 10,
  });

  const session = await auth();
  const favoritos = session?.user?.id
    ? await prisma.favorito.findMany({
        where: { userId: session.user.id, questaoId: { in: relacionadas.map((q) => q.id) } },
        select: { questaoId: true },
      })
    : [];

  return (
    <EstudarClient
      detalhe={detalhe}
      relacionadas={relacionadas}
      favoritos={favoritos.map((f) => f.questaoId)}
    />
  );
}
