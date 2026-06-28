import { notFound } from "next/navigation";
import { getQuestaoParaEdicao } from "@/server/admin-questoes";
import { EditarQuestaoForm } from "./editar-questao-form";

export const dynamic = "force-dynamic";

export default async function EditarQuestaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const questao = await getQuestaoParaEdicao(id);
  if (!questao) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <EditarQuestaoForm questao={questao} />
    </div>
  );
}
