import { listarReportes } from "@/server/reportes";
import { ReportesClient } from "./reportes-client";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const reportes = await listarReportes();
  const abertos = reportes.filter((r) => r.status !== "resolvido").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Relatório de reportes</h1>
        <p className="text-sm text-slate-400">
          Questões reportadas pelos usuários.{" "}
          <span className="font-medium text-amber-300">{abertos}</span>{" "}
          {abertos === 1 ? "em aberto" : "em aberto"} de {reportes.length}.
        </p>
      </header>

      <ReportesClient reportes={reportes} />
    </div>
  );
}
