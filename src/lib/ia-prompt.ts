import { NIVEIS, type Nivel } from "@/lib/utils";

/* =============================================================================
   Prompt do gerador de questoes

   O texto abaixo e o prompt do agente, definido pelo dono do produto. Fica
   isolado num arquivo proprio de proposito: e conteudo editorial, nao logica —
   quem ajusta o tom das questoes nao precisa mexer na action nem no client.

   O que o prompt PEDE e o que o codigo GARANTE sao coisas diferentes. Modelo de
   linguagem erra formato, repete questao e inventa nivel com acento. Por isso
   toda regra listada aqui tem um equivalente executavel em `normalizarQuestao`
   e na action — o prompt reduz a taxa de erro, o codigo e quem barra.
   ============================================================================= */

export const PROMPT_SISTEMA = `Você é um especialista em criar questões de concursos, de forma bem elaborada e com vasto conteúdo. Ao criar as questões, elas devem ser claras, mesmo havendo um tema pré-definido, a questão deve demonstrar, no enunciado, de forma clara que é aquele tema que está sendo abordado. Nunca repita questões, faça sempre de múltipla escolha. Além disso, as questões devem ser retornadas no seguinte formato, nunca gere nenhum tipo de formulário ou arquivo:

[
  {
    "assunto": "DF Brincar",
    "nivel": "Facil",
    "dificuldade": 2,
    "enunciado": "O DF Brincar é um programa voltado a:",
    "alternativas": [
      { "texto": "garantir o direito ao lazer e ao desenvolvimento infantil por meio do brincar.", "correta": true },
      { "texto": "regular o comércio de brinquedos no DF.", "correta": false },
      { "texto": "fiscalizar parques e áreas de lazer privadas.", "correta": false },
      { "texto": "promover competições esportivas entre escolas.", "correta": false },
      { "texto": "organizar o transporte escolar.", "correta": false }
    ],
    "explicacao": "O DF Brincar promove o direito ao lazer, à convivência e ao desenvolvimento infantil.",
    "fonte": "Programa DF Social; Decreto nº 42.872/2021",
    "palavrasChave": ["lazer", "desenvolvimento infantil"]
  }
]

Regras obrigatórias:
1. nivel — apenas "Facil", "Medio" ou "Dificil" (sem acento, sem variações)
2. alternativas — Exatamente 5 alternativas, exatamente 1 com "correta": true
3. enunciado — textos duplicados (mesmo conteúdo ignorando acentos) devem ser descartados
4. assunto — deve ser sempre padronizado

Processamento automático:
- O campo subassunto é derivado do assunto bruto: se o raw conter " - ", a parte após o traço vira subassunto. Ex: "DF Brincar - Atividades" → assunto="DF Brincar", subassunto="Atividades"
- Para os assuntos do DF Social, os canônicos são: Programa DF Social (Lei nº 7.008/2021 e Decreto nº 42.872/2021), DF Brincar, Incentiva DF, Agentes da Cidadania (Portaria nº 42/2023), Agentes de Cidadania Ambiental, DF Alfabetização, SOS Mulher

5. texto de apoio — Se a questão depender de um texto (interpretação, análise de trecho, gramática sobre uma passagem), o texto COMPLETO tem que estar dentro do próprio campo "enunciado": primeiro o texto, uma linha em branco, depois o comando. Nunca escreva "o texto acima", "o trecho a seguir" ou equivalente sem que a passagem esteja ali — não existe anexo, não existe outro campo. O texto de apoio deve ter no mínimo 40 palavras. Escreva uma passagem própria, no estilo pedido; não reproduza de memória obras de autores reais nem atribua a passagem a uma pessoa real.

Responda APENAS com o array JSON, sem cercas de código, sem comentários e sem texto antes ou depois.`;

/** Assuntos canonicos do DF Social, citados no prompt. */
export const ASSUNTOS_CANONICOS = [
  "Programa DF Social",
  "DF Brincar",
  "Incentiva DF",
  "Agentes da Cidadania",
  "Agentes de Cidadania Ambiental",
  "DF Alfabetização",
  "SOS Mulher",
] as const;

export type PedidoGeracao = {
  quantidade: number;
  materia: string;
  /** Nome canonico do assunto escolhido no formulario. */
  assunto: string;
  banca: string;
  /** `null` = mistura os tres niveis. */
  nivel: Nivel | null;
  /** Texto livre do admin, anexado ao pedido. */
  instrucoes?: string;
  /** Enunciados que ja existem no banco, para o modelo nao repetir. */
  enunciadosExistentes: string[];
};

/** Monta a mensagem de usuario: o pedido concreto desta geracao. */
export function montarPedido(p: PedidoGeracao): string {
  const partes = [
    `Gere ${p.quantidade} ${p.quantidade === 1 ? "questão inédita" : "questões inéditas"} de concurso público.`,
    "",
    `Matéria: ${p.materia}`,
    `Assunto (use exatamente este valor no campo "assunto"): ${p.assunto}`,
    `Banca: ${p.banca} — siga o estilo de redação dessa banca.`,
    p.nivel
      ? `Nível: ${p.nivel} em todas as questões.`
      : `Nível: misture "Facil", "Medio" e "Dificil" ao longo do conjunto.`,
  ];

  if (p.instrucoes?.trim()) {
    partes.push("", `Instruções adicionais do avaliador: ${p.instrucoes.trim()}`);
  }

  // Sem esta lista o "nunca repita questões" do prompt e inconsequente: o modelo
  // nao tem como saber o que ja existe no banco. Com ela, a taxa de descarte por
  // duplicidade cai bastante.
  if (p.enunciadosExistentes.length > 0) {
    partes.push(
      "",
      "As questões abaixo JÁ EXISTEM no banco. Não repita nenhuma delas, nem versões reescritas com as mesmas palavras-chave e a mesma resposta:",
      ...p.enunciadosExistentes.map((e, i) => `${i + 1}. ${e}`)
    );
  }

  partes.push("", `Responda com um array JSON de exatamente ${p.quantidade} objetos.`);
  return partes.join("\n");
}

/** Compara enunciados ignorando acento, caixa e espaco repetido. */
export function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "Facil" / "fácil" / "FÁCIL" -> "Facil". Devolve `null` se nao casar com
 * nenhum dos tres niveis. O prompt pede sem acento, mas o modelo escorrega:
 * normalizar aqui evita descartar uma questao boa por causa de um til.
 */
export function normalizarNivel(bruto: unknown): Nivel | null {
  if (typeof bruto !== "string") return null;
  const alvo = normalizarTexto(bruto);
  return NIVEIS.find((n) => normalizarTexto(n) === alvo) ?? null;
}

/**
 * Marcas de que a questao DEPENDE de um texto que deveria vir junto dela.
 *
 * A sutileza esta em separar o `texto` DEITICO — que aponta para algo que
 * deveria estar ali — do `texto` QUALIFICADO, que e só uma figura de linguagem
 * e se sustenta sozinho. "De acordo com o texto, ..." aponta para fora;
 * "de acordo com o texto constitucional" / "conforme o texto legal" /
 * "segundo o texto da Lei nº 8.742/1993" nao apontam para nada.
 *
 * Por isso a segunda alternativa exige que `texto` seja seguido de pontuacao:
 * se vier um qualificador depois, nao e referencia a texto de apoio.
 */
const REFERE_TEXTO = new RegExp(
  [
    // "texto/trecho/fragmento acima | abaixo | a seguir | apresentado | lido"
    String.raw`\b(texto|trecho|fragmento|excerto)\s+(acima|abaixo|a seguir|apresentado|lido|base)\b`,
    // "de acordo com o texto," — deitico: nada qualifica o `texto`
    String.raw`\b(de acordo com o|com base no|segundo o|conforme o|no|do|ao)\s+texto\s*(?=[,.:;?!]|$)`,
    // "o texto 'uma frase curta'" — chama de texto o que e uma frase
    String.raw`\b(o|no|do|ao)\s+texto\s*["“'']`,
    String.raw`\breferido texto\b`,
  ].join("|"),
  "i"
);

/**
 * Detecta a questao orfa: ela manda ler um texto que nao esta em lugar nenhum.
 *
 * E o erro mais comum em portugues, e o mais traicoeiro — o enunciado parece
 * completo e so na hora de responder a pessoa percebe que nao ha o que ler. O
 * prompt pede o texto junto; esta funcao e quem cobra.
 *
 * A medida e o "corpo" do enunciado: o que existe alem do comando. Conta o que
 * esta entre aspas, o maior bloco separado por linha em branco, ou o excedente
 * sobre o tamanho tipico de um comando isolado. Se nada disso alcanca um
 * paragrafo curto, o que veio foi so o comando.
 */
export function citaTextoAusente(enunciado: string): boolean {
  if (!REFERE_TEXTO.test(enunciado)) return false;

  const entreAspas = [...enunciado.matchAll(/["“«'']([^"”»'']{20,})["”»'']/g)].reduce(
    (total, m) => total + m[1].length,
    0
  );

  const blocos = enunciado.split(/\n\s*\n/).map((b) => b.trim());
  const maiorBloco = blocos.length > 1 ? Math.max(...blocos.map((b) => b.length)) : 0;

  // 160 caracteres e a folga para o comando ("De acordo com o texto, ...?").
  const corpo = Math.max(entreAspas, maiorBloco, enunciado.length - 160);
  return corpo < 120;
}

/**
 * Separa "DF Brincar - Atividades" em assunto + subassunto, conforme a regra de
 * processamento automatico do prompt. Aceita hifen simples e travessao.
 */
export function derivarAssunto(bruto: string): { assunto: string; subassunto: string | null } {
  const m = bruto.match(/^(.*?)\s+[-–—]\s+(.*)$/);
  if (!m) return { assunto: bruto.trim(), subassunto: null };
  return { assunto: m[1].trim(), subassunto: m[2].trim() || null };
}
