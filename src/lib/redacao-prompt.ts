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

export const PROMPT_TEMA = `Você elabora propostas de redação para concursos públicos brasileiros, no modelo dissertativo-argumentativo.

O tema precisa fazer sentido para o concurso informado: deve conversar com a área de atuação do órgão e com o que costuma ser cobrado na prova discursiva dele. Nada de tema genérico que serviria para qualquer concurso.

Use a busca na web para localizar TRÊS textos de apoio REAIS, de fontes DIFERENTES umas das outras, publicados preferencialmente nos últimos três anos. Serão aproveitados os dois melhores — o terceiro é reserva, caso alguma página não abra. Para cada um traga:
- "trecho": de 40 a 150 palavras COPIADAS LITERALMENTE da página, sem reescrever, sem resumir, sem juntar partes distantes;
- "veiculo": nome do jornal, órgão ou instituição;
- "url": o endereço exato de onde o trecho saiu.

Prefira fontes de TEXTO: jornal, portal de órgão público, agência oficial, universidade ou instituto de pesquisa. Não use vídeo, YouTube, rede social, podcast, PDF ou página cujo conteúdo não esteja escrito em HTML na própria página — o trecho precisa poder ser lido e conferido no endereço informado.

Nunca invente fonte, número, data ou autoria. Não atribua frase a quem não a disse. Se só encontrar uma ou duas fontes confiáveis, devolva só o que encontrou — é melhor do que inventar. Confira que a URL é de uma página que existe: endereço inventado é descartado automaticamente.

Responda APENAS com JSON, sem cercas de código e sem texto antes ou depois:
{
  "tema": "frase curta que nomeia o tema",
  "comando": "instrução ao candidato, no estilo de banca, dizendo o que ele deve discutir e propor",
  "textosApoio": [
    { "trecho": "...", "veiculo": "...", "url": "https://..." }
  ]
}`;

export function montarPedidoTema(p: {
  concurso: string;
  banca?: string;
  orientacao?: string;
}): string {
  const partes = [
    `Concurso: ${p.concurso}`,
    p.banca?.trim() ? `Banca: ${p.banca.trim()} — siga o estilo de comando dessa banca.` : "",
    "",
    "Proponha UM tema de redação dissertativo-argumentativa adequado a esse concurso, com os dois textos de apoio reais.",
  ].filter(Boolean);

  if (p.orientacao?.trim()) {
    partes.push("", `Orientação de quem pediu: ${p.orientacao.trim()}`);
  }
  return partes.join("\n");
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
