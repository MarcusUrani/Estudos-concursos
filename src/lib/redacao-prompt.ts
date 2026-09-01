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

/* -----------------------------------------------------------------------------
   Criterios da prova discursiva — edital SEDES-DF, item 13.3.4

   Nao e o modelo do ENEM (cinco competencias de 200). Sao TRES criterios, cada
   um valendo de 0 a 3 pontos inteiros, com pesos diferentes, e a nota final sai
   de uma formula do edital:

     [(CAC x 7) + (OT x 1,5) + (DLP x 1,5)] / 0,3

   O peso do CAC e quase cinco vezes o dos outros dois: conteudo e atendimento
   ao comando valem 70% da nota. Vale saber disso ao estudar.
   ----------------------------------------------------------------------------- */

export const CRITERIOS = [
  {
    sigla: "CAC",
    numero: 1,
    peso: 7,
    titulo: "Conteúdo e Atendimento ao Comando",
    descricao:
      "Atendimento ao tema e ao comando; pertinência, consistência e suficiência das informações; encadeamento lógico.",
  },
  {
    sigla: "OT",
    numero: 2,
    peso: 1.5,
    titulo: "Organização Textual",
    descricao:
      "Clareza, coerência, coesão, encadeamento das ideias e estrutura dissertativa.",
  },
  {
    sigla: "DLP",
    numero: 3,
    peso: 1.5,
    titulo: "Domínio da Língua Portuguesa",
    descricao: "Padrão formal, ortografia, pontuação, morfossintaxe e propriedade vocabular.",
  },
] as const;

/** Cada criterio vai de 0 a 3 pontos INTEIROS — o edital nao preve fracao. */
export const NOTA_MAX_CRITERIO = 3;
export const NOTA_MAX_TOTAL = 100;

/**
 * Formula do item 13.3.4.4. Com os tres criterios no maximo:
 * (3x7 + 3x1,5 + 3x1,5) / 0,3 = 30 / 0,3 = 100.
 */
export function notaFinal(notas: { numero: number; nota: number }[]): number {
  const de = (n: number) => notas.find((x) => x.numero === n)?.nota ?? 0;
  const cac = de(1);
  const ot = de(2);
  const dlp = de(3);

  // Itens 13.3.4.5 "a" e "b": fuga ao tema ou descumprimento do comando zera a
  // prova, e o mesmo vale para texto incompativel com a forma dissertativa. Sao
  // exatamente as descricoes da nota 0 em CAC e em OT, entao qualquer um dos
  // dois zerado zera o total — nao adianta somar o resto.
  if (cac === 0 || ot === 0) return 0;

  return (cac * 7 + ot * 1.5 + dlp * 1.5) / 0.3;
}

/* -----------------------------------------------------------------------------
   Extensao: 20 a 30 LINHAS (item 13.1)

   O edital conta linha de folha de resposta, nao palavra. Como aqui o texto e
   digitado, a contagem e uma ESTIMATIVA: 70 caracteres por linha, contando cada
   paragrafo separadamente, porque paragrafo sempre termina a linha em que esta.
   E aproximacao, e a tela diz isso — mas serve para a pessoa treinar a
   extensao, que e o que o edital cobra.
   ----------------------------------------------------------------------------- */

export const LINHAS_MIN = 20;
export const LINHAS_MAX = 30;
const CARACTERES_POR_LINHA = 70;

export function estimarLinhas(texto: string): number {
  const paragrafos = texto
    .split(new RegExp(String.fromCharCode(10) + "+"))
    .map((p) => p.trim())
    .filter(Boolean);
  return paragrafos.reduce(
    (total, p) => total + Math.max(1, Math.ceil(p.length / CARACTERES_POR_LINHA)),
    0
  );
}

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

/**
 * Passo 1 — busca. Pede SO a URL.
 *
 * Pedir o trecho literal era o que inchava a resposta do modelo de busca (ele
 * precisa ler a pagina inteira para copiar) e disparava 413 na Vercel. Era
 * tambem a porta por onde entrava citacao inventada. Agora ele so aponta o
 * endereco; o trecho e recortado da propria pagina, do nosso lado.
 */
export const PROMPT_FONTES = `Pesquise na web notícias e publicações oficiais recentes sobre o assunto pedido.

Busque sobre o PROBLEMA SOCIAL e a política pública que o enfrenta. Nunca sobre concurso, edital ou prova, e nunca páginas de apresentação institucional do órgão. Prefira jornal, agência oficial de notícias ou instituto de pesquisa, em página HTML comum — PDF, vídeo e enciclopédia servem mal.

Para cada resultado devolva o endereço, o veículo e o título da página. O título basta: não copie o corpo da matéria.

Responda só com JSON: {"fontes":[{"url":"https://...","veiculo":"nome do veículo","titulo":"título da página"}]}`;

export function montarPedidoFontes(p: { concurso: string; orientacao?: string }): string {
  // Descreve o CAMPO TEMATICO, nao o concurso: pedir "o concurso SEDES-DF"
  // fez a busca voltar com blog de cursinho e verbete de enciclopedia sobre o
  // proprio orgao, que nao servem de texto de apoio para redacao.
  const assunto = p.orientacao?.trim()
    ? p.orientacao.trim()
    : `políticas públicas e problemas sociais da área em que atua o órgão "${p.concurso}"`;
  return `Assunto: ${assunto}

Liste 5 endereços de veículos diferentes.`;
}

/** O assunto usado para escolher o paragrafo mais pertinente na pagina. */
export function assuntoDaBusca(p: { concurso: string; orientacao?: string }): string {
  return p.orientacao?.trim() || p.concurso;
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

export const PROMPT_CORRECAO = `Você é examinador de prova discursiva de concurso público e corrige segundo o edital da SEDES-DF (item 13.3.4). Não use o modelo do ENEM.

Avalie TRÊS critérios. Cada um recebe 0, 1, 2 ou 3 pontos INTEIROS — não existe nota fracionada.

CAC — Conteúdo e Atendimento ao Comando (peso 7)
Avalia o atendimento ao tema e ao comando; a pertinência, consistência e suficiência das informações; o desenvolvimento com encadeamento lógico; e o enfrentamento dos aspectos exigidos na proposta.
0 — fuga ao tema, não atendimento ao comando ou desenvolvimento manifestamente incompatível com a proposta.
1 — atendimento insuficiente ao tema ou ao comando: abordagem superficial, incompleta, pouco pertinente ou com omissões relevantes.
2 — atendimento adequado, com desenvolvimento pertinente e coerente, ainda que com limitações pontuais, omissões parciais ou aprofundamento insuficiente.
3 — atendimento integral, com desenvolvimento consistente, pertinente, suficiente e logicamente encadeado.

OT — Organização Textual (peso 1,5)
Avalia clareza, coerência, coesão, encadeamento das ideias e conformidade com a estrutura dissertativa.
0 — texto desorganizado, incoerente, sem encadeamento lógico ou coesão; ideias desarticuladas ou incompatíveis com a estrutura dissertativa.
1 — organização insuficiente, com limitações relevantes em clareza, coerência, coesão, encadeamento ou estruturação dissertativa.
2 — organização adequada, com clareza, coerência, coesão, encadeamento lógico e estrutura dissertativa identificável, ainda que com limitações pontuais.
3 — texto bem organizado, com clareza, coerência, coesão e encadeamento consistentes, e estrutura dissertativa clara e bem desenvolvida.

DLP — Domínio da Modalidade Escrita da Língua Portuguesa (peso 1,5)
Avalia o padrão formal, a ortografia, a pontuação, a morfossintaxe e a propriedade vocabular.
0 — erros graves e frequentes de grafia, pontuação, morfossintaxe ou propriedade vocabular; inadequação acentuada ao padrão formal.
1 — erros frequentes; inadequação perceptível ao padrão formal.
2 — domínio adequado, com erros pontuais e sem prejuízo relevante à correção linguística global.
3 — domínio seguro e consistente, admitidos apenas lapsos isolados e assistemáticos.

Regras:
- Quando o pedido trouxer o CONTEÚDO PROGRAMÁTICO do concurso, use-o para julgar a pertinência e a consistência do repertório dentro do CAC. Confira se o que a pessoa afirma sobre lei, programa ou conceito daquele conteúdo está CORRETO: erro conceitual em matéria do programa é falha de conteúdo e derruba o CAC. Aponte também a oportunidade perdida — o item do programa que sustentaria o argumento e ficou de fora. Nunca exija a citação de um item específico nem baixe nota por não citar: a nota é do texto, não da lista.
- Seja rigoroso e calibrado. Nota 3 exige o descritor cumprido por inteiro; na dúvida entre duas notas, fique com a menor e explique o que faltou para a maior.
- Atribua 0 em CAC se houver fuga ao tema ou descumprimento do comando, e 0 em OT se o texto for incompatível com a forma dissertativa. Qualquer um dos dois zera a prova inteira, então só use quando for realmente o caso.
- Todo comentário deve citar TRECHO CURTO do texto entre aspas e dizer o que corrigir. Comentário genérico não ensina nada.
- Escreva em segunda pessoa, falando com quem escreveu.
- Não calcule a nota final: ela é obtida por fórmula fora daqui.

Responda APENAS com JSON, sem cercas de código:
{
  "criterios": [
    { "sigla": "CAC", "nota": 0, "comentario": "..." },
    { "sigla": "OT", "nota": 0, "comentario": "..." },
    { "sigla": "DLP", "nota": 0, "comentario": "..." }
  ],
  "resumo": "dois ou três períodos sobre o desempenho geral",
  "pontosFortes": ["..."],
  "aMelhorar": ["..."]
}`;

export function montarPedidoCorrecao(p: {
  tema: string;
  comando: string;
  texto: string;
  linhas: number;
  /**
   * Conteudo programatico do concurso, uma linha por materia. Serve ao CAC:
   * o criterio de peso 7 avalia "pertinencia, consistencia e suficiencia das
   * informacoes", e sem saber o que o edital cobra o corretor julga repertorio
   * no vacuo — elogia citacao generica e deixa passar erro conceitual em lei
   * que a pessoa vai ter na prova.
   */
  conteudo?: string[];
}): string {
  const partes = [`TEMA: ${p.tema}`, `COMANDO: ${p.comando}`];

  if (p.conteudo?.length) {
    partes.push(
      "",
      "CONTEÚDO PROGRAMÁTICO DO CONCURSO (referência para julgar o repertório, não checklist):",
      ...p.conteudo
    );
  }

  partes.push("", `REDAÇÃO DO CANDIDATO (aproximadamente ${p.linhas} linhas):`, p.texto);
  return partes.join(String.fromCharCode(10));
}

/**
 * Comando padrao para texto trazido de fora.
 *
 * Quem cola uma redacao ja escrita informa o TEMA, nao o comando — o comando
 * original pode nem existir. Este e o enunciado dissertativo-argumentativo
 * classico de concurso, e e ele que o CAC vai cobrar. A tela mostra o comando
 * para a pessoa saber contra o que esta sendo avaliada.
 */
export function comandoPadrao(tema: string): string {
  return (
    `Com base no tema "${tema}", redija um texto dissertativo-argumentativo, ` +
    "posicionando-se a respeito e fundamentando o ponto de vista com argumentos " +
    "consistentes e repertório pertinente ao conteúdo do cargo."
  );
}
