import { listarRevisao } from "@/server/revisao";
import { RevisaoCliente } from "@/components/revisao-cliente";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";

export const dynamic = "force-dynamic";

export default async function ErradasPage() {
  const { questoes, favoritos } = await listarRevisao("erradas");

  return (
    <PaginaSessao>
      <Cabecalho
        etiqueta={questoes.length ? `${questoes.length} questões` : undefined}
        titulo="Questões que errei"
        descricao="Refaça o que você já errou. Errar de novo aqui custa menos do que errar na prova."
      />
      <RevisaoCliente questoes={questoes} favoritos={favoritos} tipo="erradas" />
    </PaginaSessao>
  );
}
