/* =============================================================================
   Cliente Groq

   A API do Groq e compativel com a da OpenAI, entao e so um POST em
   /openai/v1/chat/completions. Nao entra biblioteca por causa disso — uma
   dependencia inteira para um fetch nao se paga.

   Este arquivo NAO fala de questoes: recebe prompt, devolve texto. Quem sabe o
   que e uma questao e `server/admin-ia.ts`.
   ============================================================================= */

const URL_GROQ = "https://api.groq.com/openai/v1/chat/completions";

/** Trocavel por env: id de modelo e algo que o provedor aposenta sem aviso. */
const MODELO_PADRAO = "llama-3.3-70b-versatile";

/** Gerar 20 questoes leva tempo; o limite do lado da Vercel e de 60s. */
const TIMEOUT_MS = 55_000;

export function modeloGroq(): string {
  return process.env.GROQ_MODEL?.trim() || MODELO_PADRAO;
}

export class ErroGroq extends Error {}

type RespostaGroq = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string; code?: string };
};

/**
 * Uma ida ao modelo. Devolve o texto cru da resposta — a interpretacao fica
 * com quem chamou.
 *
 * Erros viram `ErroGroq` com mensagem em português, porque essa mensagem sobe
 * inteira ate a tela do admin. Em especial a de modelo desativado: quando o
 * Groq aposenta um id, o sintoma seria um 400 generico, e a correcao (definir
 * GROQ_MODEL) e impossivel de adivinhar sem o texto original da API.
 */
export async function conversarGroq(opcoes: {
  sistema: string;
  usuario: string;
  temperatura?: number;
  maxTokens?: number;
}): Promise<{ texto: string; modelo: string }> {
  const chave = process.env.GROQ_API_KEY?.trim();
  if (!chave) {
    throw new ErroGroq(
      "GROQ_API_KEY não está configurada. Adicione a chave no .env (local) e nas Environment Variables do projeto na Vercel (produção)."
    );
  }

  const modelo = modeloGroq();

  let resposta: Response;
  try {
    resposta = await fetch(URL_GROQ, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelo,
        temperature: opcoes.temperatura ?? 0.8,
        max_tokens: opcoes.maxTokens ?? 8000,
        messages: [
          { role: "system", content: opcoes.sistema },
          { role: "user", content: opcoes.usuario },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new ErroGroq(
        "O Groq demorou demais para responder. Tente novamente pedindo menos questões de uma vez."
      );
    }
    throw new ErroGroq(
      `Não foi possível falar com o Groq: ${e instanceof Error ? e.message : "erro de rede"}`
    );
  }

  const dados = (await resposta.json().catch(() => null)) as RespostaGroq | null;

  if (!resposta.ok) {
    const detalhe = dados?.error?.message ?? `HTTP ${resposta.status}`;
    if (resposta.status === 401) {
      throw new ErroGroq(`Chave do Groq recusada (401). Verifique a GROQ_API_KEY. Detalhe: ${detalhe}`);
    }
    if (resposta.status === 429) {
      throw new ErroGroq(`Limite de uso do Groq atingido. Aguarde e tente de novo. Detalhe: ${detalhe}`);
    }
    if (resposta.status === 404 || /decommission|not exist|does not exist/i.test(detalhe)) {
      throw new ErroGroq(
        `O modelo "${modelo}" não está disponível no Groq. Defina outro em GROQ_MODEL. Detalhe: ${detalhe}`
      );
    }
    throw new ErroGroq(`Groq respondeu com erro: ${detalhe}`);
  }

  const texto = dados?.choices?.[0]?.message?.content?.trim();
  if (!texto) throw new ErroGroq("O Groq respondeu vazio. Tente novamente.");

  return { texto, modelo };
}

/**
 * Extrai o array JSON da resposta do modelo.
 *
 * O prompt pede JSON puro, mas modelo e modelo: as vezes vem em cerca de codigo,
 * as vezes com uma frase antes ("Aqui estão as questões:"), as vezes embrulhado
 * num objeto. Recortar do primeiro `[` ao ultimo `]` cobre os tres casos sem
 * precisar de parser tolerante.
 */
export function extrairArrayJson(texto: string): unknown[] {
  const semCerca = texto
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const tentar = (s: string): unknown | undefined => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };

  let dado = tentar(semCerca);

  if (dado === undefined) {
    const inicio = semCerca.indexOf("[");
    const fim = semCerca.lastIndexOf("]");
    if (inicio !== -1 && fim > inicio) dado = tentar(semCerca.slice(inicio, fim + 1));
  }

  // Ultimo recurso: resposta cortada no meio por limite de tokens. O array
  // nunca fecha, entao nenhum JSON.parse do texto inteiro funciona — mas os
  // objetos ANTERIORES ao corte estao intactos. Descartar 18 questoes boas
  // porque a 19a veio pela metade seria desperdicio; recolhemos o que fechou.
  if (dado === undefined) {
    const resgatados = objetosCompletos(semCerca);
    if (resgatados.length > 0) return resgatados;
    throw new ErroGroq(
      "A resposta do Groq não veio em JSON válido. Tente gerar novamente — se persistir, reduza a quantidade."
    );
  }

  if (Array.isArray(dado)) return dado;

  // Alguns modelos embrulham em { questoes: [...] } mesmo com o prompt pedindo
  // array puro. Aceitamos qualquer chave cujo valor seja um array de objetos.
  if (dado && typeof dado === "object") {
    const valores = Object.values(dado as Record<string, unknown>);
    const arr = valores.find((v) => Array.isArray(v));
    if (Array.isArray(arr)) return arr;
    return [dado];
  }

  throw new ErroGroq("A resposta do Groq não continha nenhuma questão.");
}

/**
 * Varre o texto e devolve todo objeto JSON de primeiro nivel que esteja
 * completo, ignorando o resto.
 *
 * Conta chaves respeitando string e escape — sem isso, uma chave dentro de um
 * enunciado ("o programa {sic}") desalinharia a contagem e o objeto seria
 * recortado no lugar errado.
 */
function objetosCompletos(texto: string): unknown[] {
  const encontrados: unknown[] = [];
  let profundidade = 0;
  let inicio = -1;
  let dentroDeString = false;
  let escapado = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (dentroDeString) {
      if (escapado) escapado = false;
      else if (c === "\\") escapado = true;
      else if (c === '"') dentroDeString = false;
      continue;
    }

    if (c === '"') {
      dentroDeString = true;
    } else if (c === "{") {
      if (profundidade === 0) inicio = i;
      profundidade++;
    } else if (c === "}") {
      profundidade--;
      if (profundidade === 0 && inicio !== -1) {
        try {
          encontrados.push(JSON.parse(texto.slice(inicio, i + 1)));
        } catch {
          // objeto malformado: segue para o proximo
        }
        inicio = -1;
      }
    }
  }

  return encontrados;
}
