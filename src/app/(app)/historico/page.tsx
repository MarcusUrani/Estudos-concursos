import { listarHistorico } from "@/server/historico";
import { HistoricoCliente } from "@/components/historico-cliente";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const { itens, assuntos } = await listarHistorico();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
          <History className="h-6 w-6 text-indigo-400" />
          Histórico
        </h1>
        <p className="text-sm text-slate-400">
          Todas as questões que você respondeu, da mais recente para a mais antiga.
        </p>
      </header>
      <HistoricoCliente itens={itens} assuntos={assuntos} />
    </div>
  );
}
