import { listarConteudo } from "@/server/admin-conteudo";
import { ConteudoClient } from "./conteudo-client";

export const dynamic = "force-dynamic";

export default async function ConteudoPage() {
  const conteudo = await listarConteudo();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Conteúdo</h1>
        <p className="text-sm text-slate-400">
          Cadastre matérias, assuntos e questões do concurso{" "}
          <span className="font-medium text-indigo-300">{conteudo.concursoNome}</span>.
        </p>
      </header>

      <ConteudoClient conteudo={conteudo} />
    </div>
  );
}
