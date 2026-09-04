import { listarNotificacoes } from "@/server/notificacoes";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";
import { NotificacoesClient } from "./notificacoes-client";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const notificacoes = await listarNotificacoes();
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <PaginaSessao>
      <Cabecalho
        titulo="Notificações"
        descricao={
          naoLidas > 0
            ? `${naoLidas} ${naoLidas === 1 ? "nova" : "novas"} — novidades, atualizações e avisos de manutenção do sistema.`
            : "Novidades, atualizações e avisos de manutenção do sistema."
        }
      />
      <NotificacoesClient notificacoes={notificacoes} />
    </PaginaSessao>
  );
}
