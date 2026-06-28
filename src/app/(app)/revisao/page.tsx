import { listarRevisaoDoDia } from "@/server/revisao";
import { RevisaoDoDiaCliente } from "./revisao-do-dia-cliente";

export const dynamic = "force-dynamic";

export default async function RevisaoPage() {
  const { questoes, favoritos } = await listarRevisaoDoDia();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Revisão espaçada</h1>
        <p className="text-sm text-slate-400">
          As questões abaixo venceram na sua fila estilo Anki. Responder aqui reagenda
          automaticamente a próxima revisão (1 → 3 → 7 → 15 → 30 dias).
        </p>
      </header>

      <RevisaoDoDiaCliente questoes={questoes} favoritos={favoritos} />
    </div>
  );
}
