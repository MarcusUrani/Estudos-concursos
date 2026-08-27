import { listarConcursos, getConcursoAtualId } from "@/server/concurso";
import { listarTemasRedacao, listarMinhasRedacoes } from "@/server/redacao";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";
import { RedacaoClient } from "./redacao-client";

export const dynamic = "force-dynamic";

// Gerar tema busca na web e corrigir le a redacao inteira: as duas sao
// chamadas longas dentro de server action. 60s e o teto do plano Hobby.
export const maxDuration = 60;

export default async function RedacaoPage() {
  const [concursos, concursoAtualId] = await Promise.all([
    listarConcursos(),
    getConcursoAtualId(),
  ]);

  const inicial = concursoAtualId ?? concursos[0]?.id ?? null;
  const [temas, redacoes] = await Promise.all([
    listarTemasRedacao(inicial),
    listarMinhasRedacoes(),
  ]);

  return (
    <PaginaSessao>
      <Cabecalho
        titulo="Redação"
        descricao="Gere uma proposta para o concurso, escreva sob o comando e receba a correção comentada, de 0 a 1000."
      />
      <RedacaoClient
        concursos={concursos}
        concursoInicial={inicial}
        temasIniciais={temas}
        redacoesIniciais={redacoes}
      />
    </PaginaSessao>
  );
}
