/* =============================================================================
   Prompts do modulo de redacao

   Dois prompts bem diferentes:

   O de TEMA precisa de busca na web, porque os textos de apoio tem que ser
   reais. Modelo sem busca inventa manchete, inventa numero e atribui frase a
   quem nao disse — e uma redacao treinada em dado falso ensina a pessoa a citar
   dado falso na prova.

   O de CORRECAO nao precisa de busca: e leitura fechada do que a pessoa
   escreveu, e busca so aumentaria a chance de alucinacao.
   ============================================================================= */

/** As cinco competencias, 200 pontos cada. */
export const COMPETENCIAS = [
  {
    numero: 1,
    titulo: "Domínio da norma culta",
    descricao: "Ortografia, concordância, regência, pontuação e registro formal.",
  },
  {
    numero: 2,
    titulo: "Compreensão do tema",
    descricao: "Aderência ao tema e ao tipo textual dissertativo-argumentativo.",
  },
  {
    numero: 3,
    titulo: "Argumentação",
    descricao: "Seleção, organização e defesa dos argumentos com repertório pertinente.",
  },
  {
    numero: 4,
    titulo: "Coesão e coerência",
    descricao: "Encadeamento das ideias e uso dos mecanismos linguísticos.",
  },
  {
    numero: 5,
    titulo: "Proposta de intervenção",
    descricao: "Solução detalhada, viável e respeitosa aos direitos humanos.",
  },
] as const;

export const NOTA_MAX_COMPETENCIA = 200;
export const NOTA_MAX_TOTAL = COMPETENCIAS.length * NOTA_MAX_COMPETENCIA; // 1000

/** Minimo aceito para enviar. Abaixo disso nao ha texto para corrigir. */
export const MIN_PALAVRAS = 80;
/** Teto de seguranca: evita colar um livro inteiro dentro do prompt. */
export const MAX_PALAVRAS = 900;

// ---------------------------------------------------------------- tema

/* -----------------------------------------------------------------------------
   Duas chamadas, nao uma

   A geracao do tema era UM pedido so ao modelo de busca: "ache duas fontes
   reais E escreva o tema E o comando no estilo da banca, seguindo estas
   regras". Ele respondia 413 (Request Entity Too Large) de forma sistematica.

   Medido, com o mesmo modelo e a mesma pergunta:
     prompt atual (3 fontes, 40-150 palavras, varias regras) -> 413, 413
     prompt enxuto (2 fontes, 30-70 palavras)                -> 200, 413
     prompt minimo                                            -> 200, 200

   Ou seja: o estouro vinha do MEU pedido. Quanto mais eu exigia, mais paginas
   ele abria, ate o proprio contexto nao caber na requisicao.

   Entao o trabalho foi separado. A busca fica minima — so achar fonte e copiar
   trecho. Redigir tema e comando no estilo da banca passou para uma segunda
   chamada, SEM busca, num modelo mais forte. Sai mais barato, mais confiavel e
   o comando ainda melhora, porque e escrito ja sabendo quais textos de apoio a
   pessoa vai ter na frente.
   ----------------------------------------------------------------------------- */

/** Passo 1 — busca. Curto de proposito: pedido grande faz o modelo estourar. */
export const PROMPT_FONTES = `Busque na web notícias e publicações oficiais recentes sobre o assunto pedido.

Busque sobre o PROBLEMA SOCIAL e a política pública que o enfrenta — dados, cobertura, desafios, resultados. Nunca sobre concurso, edital ou prova, e nunca páginas de apresentação institucional do órgão (quem somos, organograma, planejamento). Prefira jornal, agência oficial de notícias ou instituto de pesquisa, em página HTML comum — PDF, vídeo, enciclopédia e blog de curso servem mal. Traga o que encontrar: se achar só uma ou duas fontes boas, devolva essas.

Para cada fonte devolva um trecho de 30 a 80 palavras copiado literalmente da página, o nome do veículo e a URL exata. Não invente fonte, número nem URL.

Responda só com JSON: {"textos":[{"trecho":"...","veiculo":"...","url":"https://..."}]}`;

export function montarPedidoFontes(p: { concurso: string; orientacao?: string }): string {
  // Descreve o CAMPO TEMATICO, nao o concurso: pedir "o concurso SEDES-DF"
  // fez a busca voltar com blog de cursinho e verbete de enciclopedia sobre o
  // proprio orgao, que nao servem de texto de apoio para redacao.
  const assunto = p.orientacao?.trim()
    ? p.orientacao.trim()
    : `políticas públicas e problemas sociais da área em que atua o órgão "${p.concurso}"`;
  return `Assunto: ${assunto}

Traga 3 fontes de veículos diferentes.`;
}

/** Passo 2 — redacao da proposta, SEM busca, com as fontes ja conferidas. */
export const PROMPT_PROPOSTA = `Você elabora propostas de redação para concursos públicos brasileiros, no modelo dissertativo-argumentativo.

Recebe textos de apoio já verificados e escreve a proposta que vai acompanhá-los. O tema precisa fazer sentido para o concurso informado: deve conversar com a área de atuação do órgão e com o que costuma ser cobrado na prova discursiva dele. Nada de tema genérico que serviria para qualquer concurso.

O comando deve dizer, no estilo da banca, o que o candidato precisa discutir e propor, e deve dialogar com os textos de apoio que ele terá em mãos — sem repetir o conteúdo deles.

Responda APENAS com JSON, sem cercas de código:
{"tema":"frase curta que nomeia o tema","comando":"instrução ao candidato"}`;

export function montarPedidoProposta(p: {
  concurso: string;
  banca?: string;
  orientacao?: string;
  textos: { trecho: string; veiculo: string }[];
}): string {
  const partes = [
    `Concurso: ${p.concurso}`,
    p.banca?.trim() ? `Banca: ${p.banca.trim()} — siga o estilo de comando dessa banca.` : "",
    p.orientacao?.trim() ? `Orientação de quem pediu: ${p.orientacao.trim()}` : "",
    "",
    "TEXTOS DE APOIO que o candidato vai receber:",
    ...p.textos.map((t, i) => `[${i + 1}] (${t.veiculo}) ${t.trecho}`),
  ].filter(Boolean);
  return partes.join(String.fromCharCode(10));
}

// ---------------------------------------------------------------- correcao

export const PROMPT_CORRECAO = `Você é examinador de redação de concurso público e corrige textos dissertativo-argumentativos.

Avalie CINCO competências, cada uma de 0 a 200, somando de 0 a 1000:

1. Domínio da norma culta — ortografia, concordância, regência, pontuação, registro.
2. Compreensão do tema e do tipo textual — aderência ao tema e ao comando; se fugir do tema, zere esta competência e explique.
3. Argumentação — seleção, organização e defesa dos argumentos; repertório pertinente.
4. Coesão e coerência — encadeamento das ideias e mecanismos linguísticos.
5. Proposta de intervenção — detalhamento, viabilidade e respeito aos direitos humanos.

Seja rigoroso e calibrado: nota alta exige texto realmente bom, e a maioria das redações não é. Cada comentário deve citar TRECHO CURTO do texto do candidato entre aspas e dizer o que corrigir — comentário genérico não ajuda ninguém a melhorar. Escreva em segunda pessoa, falando com quem escreveu.

Responda APENAS com JSON, sem cercas de código e sem texto antes ou depois:
{
  "competencias": [{ "numero": 1, "nota": 0, "comentario": "..." }],
  "total": 0,
  "resumo": "dois ou três períodos sobre o desempenho geral",
  "pontosFortes": ["..."],
  "aMelhorar": ["..."]
}`;

export function montarPedidoCorrecao(p: {
  tema: string;
  comando: string;
  texto: string;
  palavras: number;
}): string {
  return [
    `TEMA: ${p.tema}`,
    `COMANDO: ${p.comando}`,
    "",
    `REDAÇÃO DO CANDIDATO (${p.palavras} palavras):`,
    p.texto,
  ].join("\n");
}
