import { listarNotificacoesAdmin } from "@/server/notificacoes";
import { listarConcursos } from "@/server/concurso";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";
import { AdminNotificacoesClient } from "./admin-notificacoes-client";

export const dynamic = "force-dynamic";

export default async function AdminNotificacoesPage() {
  const [notificacoes, concursos] = await Promise.all([
    listarNotificacoesAdmin(),
    listarConcursos(),
  ]);

  return (
    <PaginaSessao>
      <Cabecalho
        etiqueta="Administração"
        titulo="Notificações do sistema"
        descricao="Escreva um comunicado para quem estuda. Sem concurso selecionado, ele vai para todos os usuários; com um concurso, só para quem está estudando esse."
      />
      <AdminNotificacoesClient notificacoes={notificacoes} concursos={concursos} />
    </PaginaSessao>
  );
}
