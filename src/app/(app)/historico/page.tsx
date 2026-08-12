import { listarHistorico } from "@/server/historico";
import { HistoricoCliente } from "@/components/historico-cliente";
import { Pagina, Cabecalho } from "@/components/ui/pagina";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const { itens, assuntos } = await listarHistorico();

  return (
    <Pagina>
      <Cabecalho
        titulo="Histórico"
        descricao="Todas as questões que você respondeu, da mais recente para a mais antiga."
      />
      <HistoricoCliente itens={itens} assuntos={assuntos} />
    </Pagina>
  );
}
