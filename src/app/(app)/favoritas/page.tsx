import { listarRevisao } from "@/server/revisao";
import { RevisaoCliente } from "@/components/revisao-cliente";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FavoritasPage() {
  const { questoes, favoritos } = await listarRevisao("favoritas");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
          <Star className="h-6 w-6 text-amber-400" />
          Questões favoritas
        </h1>
        <p className="text-sm text-slate-400">
          Revise as questões que você marcou com ⭐.
          {questoes.length > 0 && ` (${questoes.length})`}
        </p>
      </header>
      <RevisaoCliente questoes={questoes} favoritos={favoritos} tipo="favoritas" />
    </div>
  );
}
