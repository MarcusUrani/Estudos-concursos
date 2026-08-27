import { listarConcursos, getConcursoAtualId } from "@/server/concurso";
import { listarTemasRedacao, listarMinhasRedacoes } from "@/server/redacao";
import { PaginaSessao, Cabecalho } from "@/components/ui/pagina";
import { RedacaoClient } from "./redacao-client";

export const dynamic = "force-dynamic";

// Gerar tema busca na web e corrigir le a redacao inteira: as duas sao
// chamadas longas dentro de server action. 60s e o teto do plano Hobby.
export const maxDuration = 60;

export default async function RedacaoPage() {
  // TEMPORARIO — diagnostico. Em producao o Next esconde a mensagem real do
  // erro de render, o que deixou este modulo impossivel de depurar de fora.
  // Aqui o erro e capturado e mostrado na propria tela. REMOVER depois.
  try {
    return await Conteudo();
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    const pilha = e instanceof Error ? (e.stack ?? "").split(String.fromCharCode(10)).slice(0, 8).join(" | ") : "";
    console.error("[/redacao] falhou:", e);
    return (
      <PaginaSessao>
        <Cabecalho titulo="Redação" descricao="Diagnóstico temporário — erro capturado abaixo." />
        <pre className="overflow-x-auto rounded-sm border border-rose-700/40 bg-rose-500/5 p-4 text-xs whitespace-pre-wrap text-rose-200">
          {msg}
          {pilha}
        </pre>
      </PaginaSessao>
    );
  }
}

async function Conteudo() {
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
