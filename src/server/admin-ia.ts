"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NIVEIS, type Nivel } from "@/lib/utils";
import { conversarGroq, extrairArrayJson, ErroGroq } from "@/lib/groq";
import {
  PROMPT_SISTEMA,
  montarPedido,
  normalizarTexto,
  normalizarNivel,
  derivarAssunto,
  citaTextoAusente,
} from "@/lib/ia-prompt";

/* =============================================================================
   Geracao de questoes por IA

   Aberta a qualquer usuario autenticado. O que ela grava, porem, e conteudo
   COMPARTILHADO: questao nao tem dono, entao o que uma pessoa gerar e salvar
   entra no treino de todos que estudam aquele concurso.

   O fluxo tem DOIS passos de proposito: `gerarQuestoesIA` nao grava nada, so
   devolve o que o modelo produziu ja validado. Quem grava e
   `salvarQuestoesGeradas`, depois da revisao na tela.

   Isso nao e cerimonia: questao gerada por modelo erra a fonte e inventa
   numero de decreto com a maior naturalidade, e o banco alimenta o estudo de
   uma pessoa que vai fazer a prova. Revisar antes de gravar e o unico jeito
   honesto de usar isso.
   ============================================================================= */

/* -----------------------------------------------------------------------------
   Orcamento de tokens

   O tier gratuito do Groq limita TOKENS POR MINUTO, e o limite varia por
   modelo: 8.000 no gpt-oss-120b (o padrao) e 12.000 no llama-3.3-70b. Medido
   nos headers `x-ratelimit-limit-tokens`.

   Pior: o Groq debita o `max_tokens` RESERVADO, nao o que a resposta gastou.
   Entao pedir um teto folgado "por seguranca" e o que estoura a cota — e o
   orcamento inteiro do minuto some numa requisicao so.

   Os numeros abaixo cabem no menor limite (8.000), somando entrada e saida.
   ----------------------------------------------------------------------------- */

/** Teto por geracao. Limitado pela cota por minuto, nao pelo tempo. */
const MAX_QUANTIDADE = 12;

/** Quantos enunciados existentes mandamos como "nao repita" — entram na cota. */
const MAX_CONTEXTO_EXISTENTES = 20;

/** Teto de saida, proporcional ao pedido. */
function tetoTokens(quantidade: number): number {
  // 450 por questao vem da medicao: 380 truncava lotes verbosos. O teto de 5800
  // deixa ~2.200 para a entrada dentro dos 8.000 do minuto. Se ainda assim a
  // resposta cortar, o parser resgata as questoes ja fechadas.
  return Math.min(5800, quantidade * 450 + 500);
}

async function exigirUsuario() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Você precisa estar autenticada.");
}

// A arvore concurso > materia > assunto que alimenta os seletores vive em
// `server/conteudo.ts`, junto das demais acoes de nivel usuario.

// ---------------------------------------------------------------- geracao

export type AlternativaGerada = { texto: string; correta: boolean };

export type QuestaoGerada = {
  enunciado: string;
  nivel: Nivel;
  dificuldade: number;
  explicacao: string;
  fonte: string | null;
  palavrasChave: string[];
  subassunto: string | null;
  alternativas: AlternativaGerada[];
};

export type ResultadoGeracao = {
  questoes: QuestaoGerada[];
  /** Motivo de cada item que o modelo devolveu e nao passou na validacao. */
  descartadas: string[];
  modelo: string;
};

const alternativaSchema = z.object({
  texto: z.string(),
  correta: z.boolean(),
});

// Frouxo de proposito: o modelo erra tipos (dificuldade como string, campos
// ausentes). Quem aperta e a normalizacao abaixo, item a item, para que UM item
// torto nao derrube a geracao inteira.
const itemSchema = z.object({
  assunto: z.string().nullish(),
  subassunto: z.string().nullish(),
  enunciado: z.string(),
  nivel: z.unknown().nullish(),
  dificuldade: z.coerce.number().nullish(),
  explicacao: z.string().nullish(),
  fonte: z.string().nullish(),
  /** Nome antigo. O modelo as vezes reproduz o formato anterior. */
  fonteLegal: z.string().nullish(),
  palavrasChave: z.array(z.string()).nullish(),
  alternativas: z.array(alternativaSchema),
});

export async function gerarQuestoesIA(input: {
  concursoId: string;
  assuntoId: string;
  banca: string;
  quantidade: number;
  nivel?: string | null;
  instrucoes?: string;
}): Promise<ResultadoGeracao> {
  await exigirUsuario();

  const quantidade = Math.min(MAX_QUANTIDADE, Math.max(1, Math.round(input.quantidade || 0)));

  const assunto = await prisma.assunto.findFirst({
    where: { id: input.assuntoId, concursoId: input.concursoId },
    select: { id: true, nome: true, materia: { select: { nome: true } } },
  });
  if (!assunto) throw new Error("Selecione um assunto válido para o concurso escolhido.");

  const nivelPedido = input.nivel ? normalizarNivel(input.nivel) : null;

  // Enunciados que ja existem NESTE assunto: e o contexto que faz o "nunca
  // repita" do prompt valer alguma coisa.
  const existentesDb = await prisma.questao.findMany({
    where: { concursoId: input.concursoId, assuntoId: assunto.id },
    select: { enunciado: true },
    orderBy: { createdAt: "desc" },
    take: MAX_CONTEXTO_EXISTENTES,
  });

  // Para o descarte por duplicidade olhamos o concurso inteiro, nao so o assunto.
  const todosEnunciados = await prisma.questao.findMany({
    where: { concursoId: input.concursoId },
    select: { enunciado: true },
  });
  const jaExistem = new Set(todosEnunciados.map((q) => normalizarTexto(q.enunciado)));

  const { texto, modelo } = await conversarGroq({
    maxTokens: tetoTokens(quantidade),
    sistema: PROMPT_SISTEMA,
    usuario: montarPedido({
      quantidade,
      materia: assunto.materia?.nome ?? "—",
      assunto: assunto.nome,
      banca: input.banca?.trim() || "QUADRIX",
      nivel: nivelPedido,
      instrucoes: input.instrucoes,
      enunciadosExistentes: existentesDb.map((q) => q.enunciado),
    }),
  });

  const brutos = extrairArrayJson(texto);

  const questoes: QuestaoGerada[] = [];
  const descartadas: string[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < brutos.length; i++) {
    const pos = `#${i + 1}`;
    const parsed = itemSchema.safeParse(brutos[i]);
    if (!parsed.success) {
      descartadas.push(`${pos}: formato inesperado (${parsed.error.issues[0]?.message ?? "inválido"}).`);
      continue;
    }
    const it = parsed.data;

    const enunciado = it.enunciado.trim();
    if (!enunciado) {
      descartadas.push(`${pos}: enunciado vazio.`);
      continue;
    }

    // Regra 3: duplicado (ignorando acento) e descartado — tanto contra o banco
    // quanto contra os itens desta mesma resposta.
    const chave = normalizarTexto(enunciado);
    if (jaExistem.has(chave)) {
      descartadas.push(`${pos}: já existe questão com esse enunciado no banco.`);
      continue;
    }
    if (vistos.has(chave)) {
      descartadas.push(`${pos}: repetida dentro da própria geração.`);
      continue;
    }

    // Regra 1: nivel so pode ser um dos tres.
    const nivel = normalizarNivel(it.nivel) ?? nivelPedido;
    if (!nivel) {
      descartadas.push(`${pos}: nível inválido (use Facil, Medio ou Dificil).`);
      continue;
    }

    // Regra 2: exatamente 5 alternativas, exatamente 1 correta.
    const alts = it.alternativas.map((a) => ({ texto: a.texto.trim(), correta: !!a.correta }));
    if (alts.length !== 5) {
      descartadas.push(`${pos}: ${alts.length} alternativas (a regra pede exatamente 5).`);
      continue;
    }
    if (alts.some((a) => !a.texto)) {
      descartadas.push(`${pos}: alternativa em branco.`);
      continue;
    }
    if (alts.filter((a) => a.correta).length !== 1) {
      descartadas.push(`${pos}: precisa de exatamente 1 alternativa correta.`);
      continue;
    }

    const explicacao = (it.explicacao ?? "").trim();
    if (!explicacao) {
      descartadas.push(`${pos}: sem explicação.`);
      continue;
    }

    // Regra 5: nao existe anexo. Se o enunciado manda ler um texto, o texto
    // precisa estar nele.
    if (citaTextoAusente(enunciado)) {
      descartadas.push(`${pos}: manda ler um texto de apoio que não está no enunciado.`);
      continue;
    }

    // Regra 4 + processamento automatico: o assunto e sempre o canonico
    // escolhido no formulario. Se o modelo devolveu "Assunto - Parte", a parte
    // depois do traco vira subassunto.
    const derivado = derivarAssunto(it.assunto?.trim() || assunto.nome);
    const subassunto = (it.subassunto?.trim() || derivado.subassunto) ?? null;

    questoes.push({
      enunciado,
      nivel,
      dificuldade: Math.min(5, Math.max(1, Math.round(it.dificuldade ?? 3))),
      explicacao,
      fonte: (it.fonte ?? it.fonteLegal)?.trim() || null,
      palavrasChave: (it.palavrasChave ?? []).map((p) => p.trim()).filter(Boolean),
      subassunto,
      alternativas: alts,
    });
    vistos.add(chave);
  }

  // O modelo as vezes entrega mais do que foi pedido (ja veio com 27 para um
  // pedido de 20). A quantidade escolhida no formulario e um contrato: entregar
  // mais so aumenta a fila de revisao sem ninguem ter pedido.
  if (questoes.length > quantidade) questoes.length = quantidade;

  if (questoes.length === 0) {
    throw new ErroGroq(
      descartadas.length > 0
        ? `Nenhuma questão utilizável. Motivos: ${descartadas.slice(0, 5).join(" ")}`
        : "O modelo não devolveu nenhuma questão. Tente novamente."
    );
  }

  return { questoes, descartadas, modelo };
}

// ---------------------------------------------------------------- gravacao

export type ResultadoGravacao = { criadas: number; ignoradas: number; erros: string[] };

/**
 * Grava as questoes aprovadas na revisao.
 *
 * Revalida tudo do zero. O que chega aqui passou pela tela, mas veio do
 * cliente: confiar na validacao ja feita seria confiar no navegador.
 */
export async function salvarQuestoesGeradas(input: {
  concursoId: string;
  assuntoId: string;
  banca: string;
  questoes: QuestaoGerada[];
}): Promise<ResultadoGravacao> {
  await exigirUsuario();

  const assunto = await prisma.assunto.findFirst({
    where: { id: input.assuntoId, concursoId: input.concursoId },
    select: { id: true },
  });
  if (!assunto) throw new Error("Assunto inválido para o concurso escolhido.");

  const banca = input.banca?.trim() || "QUADRIX";
  const existentes = new Set(
    (
      await prisma.questao.findMany({
        where: { concursoId: input.concursoId },
        select: { enunciado: true },
      })
    ).map((q) => normalizarTexto(q.enunciado))
  );

  const erros: string[] = [];
  let criadas = 0;
  let ignoradas = 0;

  for (let i = 0; i < input.questoes.length; i++) {
    const q = input.questoes[i];
    const pos = `#${i + 1}`;

    const enunciado = q.enunciado?.trim();
    const explicacao = q.explicacao?.trim();
    if (!enunciado || !explicacao) {
      erros.push(`${pos}: enunciado e explicação são obrigatórios.`);
      continue;
    }
    if (!NIVEIS.includes(q.nivel)) {
      erros.push(`${pos}: nível inválido.`);
      continue;
    }
    if (citaTextoAusente(enunciado)) {
      erros.push(`${pos}: cita um texto de apoio que não está no enunciado.`);
      continue;
    }

    const alts = (q.alternativas ?? []).map((a) => ({
      texto: a.texto?.trim() ?? "",
      correta: !!a.correta,
    }));
    if (alts.length !== 5 || alts.some((a) => !a.texto)) {
      erros.push(`${pos}: precisa de 5 alternativas preenchidas.`);
      continue;
    }
    if (alts.filter((a) => a.correta).length !== 1) {
      erros.push(`${pos}: precisa de exatamente 1 alternativa correta.`);
      continue;
    }

    if (existentes.has(normalizarTexto(enunciado))) {
      ignoradas++;
      continue;
    }

    const subassuntoId = await resolverSubassunto(assunto.id, q.subassunto ?? undefined);

    await prisma.questao.create({
      data: {
        enunciado,
        explicacao,
        nivel: q.nivel,
        banca,
        fonte: q.fonte?.trim() || null,
        dificuldade: Math.min(5, Math.max(1, Math.round(q.dificuldade ?? 3))),
        palavrasChave: (q.palavrasChave ?? []).map((p) => p.trim()).filter(Boolean).join(", ") || null,
        concursoId: input.concursoId,
        assuntoId: assunto.id,
        subassuntoId,
        alternativas: {
          create: alts.map((a, idx) => ({ texto: a.texto, correta: a.correta, ordem: idx })),
        },
      },
    });
    existentes.add(normalizarTexto(enunciado));
    criadas++;
  }

  revalidatePath("/conteudo");
  revalidatePath("/estudar");
  return { criadas, ignoradas, erros };
}

/** Acha (ou cria) o subassunto pelo nome dentro do assunto. */
async function resolverSubassunto(assuntoId: string, nome?: string): Promise<string | undefined> {
  const limpo = nome?.trim();
  if (!limpo) return undefined;
  const existente = await prisma.subassunto.findFirst({
    where: { assuntoId, nome: limpo },
    select: { id: true },
  });
  if (existente) return existente.id;
  const criado = await prisma.subassunto.create({ data: { nome: limpo, assuntoId } });
  return criado.id;
}
