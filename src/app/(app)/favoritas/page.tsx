import { listarRevisao } from "@/server/revisao";
import { RevisaoCliente } from "@/components/revisao-cliente";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";

export const dynamic = "force-dynamic";

export default async function FavoritasPage() {
  const { questoes, favoritos } = await listarRevisao("favoritas");

  return (
    <PaginaSessao>
      <Cabecalho
        etiqueta={questoes.length ? `${questoes.length} questões` : undefined}
        titulo="Questões favoritas"
        descricao="As questões que você marcou com a estrela durante o treino."
      />
      <RevisaoCliente questoes={questoes} favoritos={favoritos} tipo="favoritas" />
    </PaginaSessao>
  );
}
