import { listarRevisao } from "@/server/revisao";
import { RevisaoCliente } from "@/components/revisao-cliente";
import { XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ErradasPage() {
  const { questoes, favoritos } = await listarRevisao("erradas");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
          <XCircle className="h-6 w-6 text-rose-400" />
          Questões que errei
        </h1>
        <p className="text-sm text-slate-400">
          Refaça as questões em que você já errou para fixar o conteúdo.
          {questoes.length > 0 && ` (${questoes.length})`}
        </p>
      </header>
      <RevisaoCliente questoes={questoes} favoritos={favoritos} tipo="erradas" />
    </div>
  );
}
