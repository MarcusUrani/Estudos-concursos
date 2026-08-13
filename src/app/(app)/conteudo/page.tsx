import { auth } from "@/auth";
import { listarConteudo } from "@/server/admin-conteudo";
import { listarArvoreConteudo } from "@/server/conteudo";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";
import { ConteudoClient } from "./conteudo-client";

export const dynamic = "force-dynamic";

// A geracao por IA e uma chamada de rede longa dentro de uma server action.
// O padrao da Vercel e 10s, que nao cobre um lote de 20 questoes; 60s e o teto
// do plano Hobby e sobra folga para o Groq, que responde rapido.
export const maxDuration = 60;

export default async function ConteudoPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  // `listarConteudo` alimenta as abas Questões e Estudo, que sao so de admin —
  // e a propria action exige admin. Para usuario comum nem chamamos.
  const [concursos, conteudo] = await Promise.all([
    listarArvoreConteudo(),
    isAdmin ? listarConteudo() : Promise.resolve(null),
  ]);

  return (
    <PaginaSessao>
      <Cabecalho
        titulo="Conteúdo"
        descricao={
          isAdmin
            ? "Cadastre matérias, assuntos e questões — manualmente, em lote por JSON ou gerando com IA."
            : "Crie matérias e assuntos e gere questões com IA. O que você salvar entra no banco de quem estuda o mesmo concurso."
        }
      />

      <ConteudoClient conteudo={conteudo} concursos={concursos} isAdmin={isAdmin} />
    </PaginaSessao>
  );
}
