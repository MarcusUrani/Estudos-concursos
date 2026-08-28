/* =============================================================================
   Conferencia de citacao

   O modelo com busca traz trecho e URL. Isso NAO basta: ele pode acertar a URL
   e mesmo assim parafrasear o trecho, ou citar de memoria uma pagina que leu
   por alto. Como o texto de apoio existe justamente para a pessoa citar dado
   real na prova, aqui a citacao e conferida contra a pagina de verdade.

   O que esta funcao garante: o trecho aparece literalmente na fonte.
   O que ela NAO garante: que a fonte seja confiavel, ou que o trecho nao esteja
   fora de contexto. Isso continua sendo leitura humana.
   ============================================================================= */

// 9s e nao 6s: portal de orgao publico brasileiro costuma responder devagar, e
// 6s descartava fonte boa por lentidao. As paginas sao buscadas em paralelo,
// entao isso custa 9s de relogio, nao 9s por fonte.
const TIMEOUT_MS = 9_000;
/** Janela do trecho usada na comparacao. Curta o bastante para sobreviver a
 *  diferenca de pontuacao, longa o bastante para nao casar por acaso. */
const JANELA = 60;

/** Deixa so o essencial: minusculas, sem acento, sem pontuacao, espaco unico. */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Descobre o charset da pagina: header, senao `<meta charset>`, senao utf-8. */
function descobrirCharset(contentType: string | null, bytes: ArrayBuffer): string {
  const doHeader = contentType?.match(/charset=([\w-]+)/i)?.[1];
  if (doHeader) return doHeader.toLowerCase();

  // Le o inicio como latin1 so para achar a meta — funciona para qualquer
  // charset de byte unico, que e onde o problema aparece.
  const inicio = new TextDecoder("latin1").decode(bytes.slice(0, 4096));
  const daMeta =
    inicio.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ??
    inicio.match(/charset=([\w-]+)/i)?.[1];
  return (daMeta ?? "utf-8").toLowerCase();
}

/** HTML -> texto corrido, sem script/style. */
function extrairTexto(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ");
}

export type ResultadoConferencia = {
  conferido: boolean;
  /** Por que nao conferiu — vai para log, nao para a tela. */
  motivo?: string;
};

/**
 * Baixa a URL e verifica se o trecho aparece nela.
 *
 * Falha de rede NAO invalida o texto de apoio: devolve `conferido: false` com
 * motivo. Site fora do ar ou que bloqueia robo e comum, e nesse caso a tela
 * apenas avisa que a citacao nao pôde ser conferida — em vez de descartar uma
 * fonte que provavelmente esta certa.
 */
export async function verificarCitacao(
  url: string,
  trecho: string
): Promise<ResultadoConferencia> {
  let u: URL;
  try {
    u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { conferido: false, motivo: "protocolo inesperado" };
    }
  } catch {
    return { conferido: false, motivo: "URL inválida" };
  }

  let resposta: Response;
  try {
    resposta = await fetch(u, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Sem user-agent de navegador, muito portal devolve 403.
        "User-Agent":
          "Mozilla/5.0 (compatible; Gabarix/1.0; verificacao de citacao)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return { conferido: false, motivo: "não foi possível acessar a página" };
  }

  if (!resposta.ok) return { conferido: false, motivo: `HTTP ${resposta.status}` };

  // PDF, DOC e afins nao sao lidos aqui. Distinguir do "trecho nao encontrado"
  // importa: um diz "nao consegui conferir", o outro diz "pode estar errado".
  const tipo = resposta.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml/i.test(tipo)) {
    return { conferido: false, motivo: `formato não conferível (${tipo.split(";")[0] || "desconhecido"})` };
  }

  let pagina: string;
  try {
    const bytes = await resposta.arrayBuffer();
    const charset = descobrirCharset(resposta.headers.get("content-type"), bytes);
    try {
      pagina = new TextDecoder(charset).decode(bytes);
    } catch {
      pagina = new TextDecoder("utf-8").decode(bytes);
    }
  } catch {
    return { conferido: false, motivo: "não foi possível ler a página" };
  }

  const alvo = normalizar(extrairTexto(pagina));
  const citacao = normalizar(trecho);
  if (citacao.length < 25) return { conferido: false, motivo: "trecho curto demais" };

  // Compara por janela deslizante em vez de exigir o trecho inteiro: o modelo
  // costuma acertar o miolo e escorregar na pontuacao das bordas.
  const passo = Math.max(1, Math.floor(JANELA / 2));
  for (let i = 0; i + JANELA <= citacao.length; i += passo) {
    if (alvo.includes(citacao.slice(i, i + JANELA))) return { conferido: true };
  }
  // Trecho entre 25 e 60 caracteres: compara inteiro.
  if (citacao.length < JANELA && alvo.includes(citacao)) return { conferido: true };

  return { conferido: false, motivo: "trecho não encontrado na página" };
}
