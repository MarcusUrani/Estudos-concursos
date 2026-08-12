import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { podeAcessarRevisao } from "@/lib/acesso";
import { listarRevisaoDoDia } from "@/server/revisao";
import { RevisaoDoDiaCliente } from "./revisao-do-dia-cliente";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";

export const dynamic = "force-dynamic";

export default async function RevisaoPage() {
  const session = await auth();
  if (!podeAcessarRevisao(session?.user?.email)) redirect("/dashboard");

  const { questoes, favoritos } = await listarRevisaoDoDia();

  return (
    <PaginaSessao>
      <Cabecalho
        etiqueta={questoes.length ? `${questoes.length} vencidas hoje` : undefined}
        titulo="Revisão espaçada"
        descricao="As questões abaixo venceram na sua fila. Responder aqui reagenda a próxima revisão automaticamente: 1 → 3 → 7 → 15 → 30 dias."
      />
      <RevisaoDoDiaCliente questoes={questoes} favoritos={favoritos} />
    </PaginaSessao>
  );
}
