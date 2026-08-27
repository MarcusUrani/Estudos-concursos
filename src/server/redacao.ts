"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { conversarGroq, extrairObjetoJson, modeloGroqComBusca, ErroGroq } from "@/lib/groq";
import { verificarCitacao } from "@/lib/verificar-citacao";
import {
  PROMPT_TEMA,
  PROMPT_CORRECAO,
  montarPedidoTema,
  montarPedidoCorrecao,
  COMPETENCIAS,
  NOTA_MAX_COMPETENCIA,
  MIN_PALAVRAS,
  MAX_PALAVRAS,
} from "@/lib/redacao-prompt";

/* =============================================================================
   Modulo de redacao

   Tres passos: a IA propoe um tema para o concurso com dois textos de apoio
   REAIS, a pessoa escreve, a IA corrige em cinco competencias (0 a 1000).

   O TEMA e compartilhado, como o resto do conteudo: fica visivel para todos que
   estudam aquele concurso. A REDACAO nao — ela e de quem escreveu, e so essa
   pessoa ve o texto e a nota. Toda consulta de redacao filtra por userId.
   ============================================================================= */

/* -----------------------------------------------------------------------------
   Erro como VALOR, nao como excecao

   Em producao o Next apaga a mensagem de qualquer erro lancado numa server
   action e devolve 500 com um digest. Ou seja: mensagens escritas para a
   usuaria ("GROQ_API_KEY nao configurada", "o modelo demorou demais") nunca
   chegavam na tela — ela via um 500 opaco, e nem o log ajudava sem acesso ao
   painel.

   Por isso as acoes que podem falhar por motivo esperado devolvem
   `{ ok: false, erro }` em vez de lancar. A excecao continua existindo para
   falha de programacao, que e o que deve mesmo virar 500.
   ----------------------------------------------------------------------------- */

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

function falha(contexto: string, e: unknown): { ok: false; erro: string } {
  // Registrado no servidor tambem: o log da Vercel guarda a pilha completa.
  console.error(`[redacao] ${contexto}:`, e);
  const erro =
    e instanceof Error && e.message
      ? e.message
      : "Erro inesperado. Tente novamente em alguns instantes.";
  return { ok: false, erro };
}

async function exigirUsuario(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Você precisa estar autenticada.");
  return session.user.id;
}

function palavrasDe(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------- tipos

export type TextoApoioDTO = {
  id: string;
  trecho: string;
  veiculo: string;
  url: string;
  conferido: boolean;
};

export type TemaDTO = {
  id: string;
  tema: string;
  comando: string;
  banca: string | null;
  criadoEm: string;
  concursoNome: string | null;
  textos: TextoApoioDTO[];
  /** Quantas redacoes a pessoa logada ja enviou para este tema. */
  minhasRedacoes: number;
};

export type CompetenciaDTO = { numero: number; nota: number; comentario: string };

export type RedacaoDTO = {
  id: string;
  temaId: string;
  tema: string;
  texto: string;
  palavras: number;
  enviadaEm: string;
  total: number | null;
  resumo: string | null;
  pontosFortes: string[];
  aMelhorar: string[];
  competencias: CompetenciaDTO[];
};

// ---------------------------------------------------------------- geracao do tema

const textoApoioSchema = z.object({
  trecho: z.string(),
  veiculo: z.string().nullish(),
  url: z.string(),
});

const temaSchema = z.object({
  tema: z.string(),
  comando: z.string(),
  textosApoio: z.array(textoApoioSchema).nullish(),
});

export async function gerarTemaRedacao(input: {
  concursoId: string;
  banca?: string;
  orientacao?: string;
}): Promise<Resultado<TemaDTO>> {
  try {
    return { ok: true, dados: await gerar(input) };
  } catch (e) {
    return falha("gerarTemaRedacao", e);
  }
}

async function gerar(input: {
  concursoId: string;
  banca?: string;
  orientacao?: string;
}): Promise<TemaDTO> {
  const userId = await exigirUsuario();

  const concurso = await prisma.concurso.findUnique({
    where: { id: input.concursoId },
    select: { id: true, nome: true },
  });
  if (!concurso) throw new Error("Selecione um concurso válido.");

  const inicio = Date.now();

  /*
   * Uma proposta so vale com FONTE CONFERIDA.
   *
   * Medido em producao: o modelo de busca inventou duas URLs perfeitamente
   * plausiveis (uma do G1, uma da UnB) — as duas davam 404, com trecho e dados
   * igualmente inventados. Marcar como "nao conferida" e deixar passar nao
   * resolve: quem esta estudando sob pressao usa o que esta na tela, e citar
   * dado falso na prova e pior do que nao citar nada.
   *
   * Entao: so entram textos que a conferencia aprovou. Se nenhum passar,
   * tentamos de novo (busca nova costuma trazer resultado diferente) e, se
   * ainda assim nao houver fonte real, a proposta NAO e salva.
   */
  let ultimoMotivo = "";

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const proposta = await pedirProposta(concurso.nome, input, inicio);

    const conferidas = await Promise.all(
      proposta.candidatos.map(async (c) => ({
        ...c,
        ...(await verificarCitacao(c.url, c.trecho)),
      }))
    );

    const validos = conferidas.filter((c) => c.conferido).slice(0, 2);

    if (validos.length > 0) {
      const criado = await prisma.temaRedacao.create({
        data: {
          tema: proposta.tema,
          comando: proposta.comando,
          banca: input.banca?.trim() || null,
          concursoId: concurso.id,
          autorId: userId,
          textos: {
            create: validos.map((c, i) => ({
              trecho: c.trecho,
              veiculo: c.veiculo,
              url: c.url,
              ordem: i,
              conferido: true,
            })),
          },
        },
        include: {
          textos: { orderBy: { ordem: "asc" } },
          concurso: { select: { nome: true } },
        },
      });

      revalidatePath("/redacao");
      return paraTemaDTO(criado, 0);
    }

    ultimoMotivo = conferidas.map((c) => c.motivo ?? "não conferida").join("; ");

    // Nao comeca outra rodada se nao houver tempo — a funcao tem teto de 60s.
    if (Date.now() - inicio > 30_000) break;
  }

  throw new ErroGroq(
    "Não consegui confirmar nenhuma fonte real para este tema — as páginas citadas não abriram ou o trecho não estava nelas. " +
      "Nenhuma proposta foi salva. Tente de novo, ou use o campo de orientação para apontar um assunto mais noticiado. " +
      `(motivos: ${ultimoMotivo || "sem candidatos"})`
  );
}

type Candidato = { trecho: string; veiculo: string; url: string };

/** Uma ida ao modelo de busca: devolve o tema e os candidatos a texto de apoio. */
async function pedirProposta(
  concursoNome: string,
  input: { banca?: string; orientacao?: string },
  inicio: number
): Promise<{ tema: string; comando: string; candidatos: Candidato[] }> {
  // O orcamento encolhe a cada rodada, para as duas caberem no teto da funcao.
  const gasto = Date.now() - inicio;
  const orcamento = Math.max(8_000, 38_000 - gasto);

  const { texto } = await conversarGroq({
    // Modelo COM busca: os textos de apoio precisam existir de verdade.
    modelo: modeloGroqComBusca(),
    tentativas: 2,
    timeoutMs: orcamento,
    orcamentoMs: orcamento,
    temperatura: 0.6,
    maxTokens: 3000,
    sistema: PROMPT_TEMA,
    usuario: montarPedidoTema({
      concurso: concursoNome,
      banca: input.banca,
      orientacao: input.orientacao,
    }),
  });

  const parsed = temaSchema.safeParse(extrairObjetoJson(texto));
  if (!parsed.success) {
    throw new ErroGroq("A proposta veio em formato inesperado. Tente gerar de novo.");
  }

  const tema = parsed.data.tema.trim();
  const comando = parsed.data.comando.trim();
  if (!tema || !comando) throw new ErroGroq("A proposta veio incompleta. Tente de novo.");

  // Duas citacoes da MESMA pagina nao sao dois textos de apoio.
  const vistas = new Set<string>();
  const candidatos = (parsed.data.textosApoio ?? [])
    .map((t) => ({
      trecho: t.trecho.trim(),
      veiculo: t.veiculo?.trim() || "Fonte não identificada",
      url: t.url.trim(),
    }))
    .filter((t) => {
      if (!t.trecho || !t.url) return false;
      const chave = t.url.replace(/[#?].*$/, "");
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    })
    .slice(0, 3);

  return { tema, comando, candidatos };
}

// ---------------------------------------------------------------- leitura

type TemaComTextos = {
  id: string;
  tema: string;
  comando: string;
  banca: string | null;
  criadoEm: Date;
  concurso: { nome: string } | null;
  textos: { id: string; trecho: string; veiculo: string; url: string; conferido: boolean }[];
};

function paraTemaDTO(t: TemaComTextos, minhasRedacoes: number): TemaDTO {
  return {
    id: t.id,
    tema: t.tema,
    comando: t.comando,
    banca: t.banca,
    criadoEm: t.criadoEm.toISOString(),
    concursoNome: t.concurso?.nome ?? null,
    textos: t.textos.map((x) => ({
      id: x.id,
      trecho: x.trecho,
      veiculo: x.veiculo,
      url: x.url,
      conferido: x.conferido,
    })),
    minhasRedacoes,
  };
}

/** Temas do concurso, do mais novo para o mais antigo. */
export async function listarTemasRedacao(concursoId: string | null): Promise<TemaDTO[]> {
  const userId = await exigirUsuario();
  if (!concursoId) return [];

  const temas = await prisma.temaRedacao.findMany({
    where: { concursoId },
    orderBy: { criadoEm: "desc" },
    take: 30,
    include: {
      textos: { orderBy: { ordem: "asc" } },
      concurso: { select: { nome: true } },
      _count: { select: { redacoes: { where: { userId } } } },
    },
  });

  return temas.map((t) => paraTemaDTO(t, t._count.redacoes));
}

// ---------------------------------------------------------------- envio e correcao

const competenciaSchema = z.object({
  numero: z.coerce.number(),
  nota: z.coerce.number(),
  comentario: z.string().nullish(),
});

const correcaoSchema = z.object({
  competencias: z.array(competenciaSchema),
  total: z.coerce.number().nullish(),
  resumo: z.string().nullish(),
  pontosFortes: z.array(z.string()).nullish(),
  aMelhorar: z.array(z.string()).nullish(),
});

/** Grava a redacao, manda corrigir e devolve o resultado. */
export async function enviarRedacao(input: {
  temaId: string;
  texto: string;
}): Promise<Resultado<RedacaoDTO>> {
  try {
    return { ok: true, dados: await corrigir(input) };
  } catch (e) {
    return falha("enviarRedacao", e);
  }
}

async function corrigir(input: {
  temaId: string;
  texto: string;
}): Promise<RedacaoDTO> {
  const userId = await exigirUsuario();

  const texto = input.texto?.trim() ?? "";
  const palavras = palavrasDe(texto);
  if (palavras < MIN_PALAVRAS) {
    throw new Error(
      `A redação precisa de pelo menos ${MIN_PALAVRAS} palavras — esta tem ${palavras}.`
    );
  }
  if (palavras > MAX_PALAVRAS) {
    throw new Error(`A redação passou de ${MAX_PALAVRAS} palavras — esta tem ${palavras}.`);
  }

  const tema = await prisma.temaRedacao.findUnique({
    where: { id: input.temaId },
    select: { id: true, tema: true, comando: true },
  });
  if (!tema) throw new Error("Tema não encontrado.");

  const { texto: bruto } = await conversarGroq({
    // Correcao NAO usa busca: e leitura fechada do que a pessoa escreveu, e
    // busca so abriria espaco para o modelo inventar contexto.
    temperatura: 0.3,
    maxTokens: 2500,
    sistema: PROMPT_CORRECAO,
    usuario: montarPedidoCorrecao({
      tema: tema.tema,
      comando: tema.comando,
      texto,
      palavras,
    }),
  });

  const parsed = correcaoSchema.safeParse(extrairObjetoJson(bruto));
  if (!parsed.success) {
    throw new ErroGroq("A correção veio em formato inesperado. Tente enviar novamente.");
  }

  // Sempre as cinco competencias, sempre dentro da faixa. O modelo as vezes
  // pula uma ou estoura o teto; aqui a escala e garantida.
  const notas = COMPETENCIAS.map((c) => {
    const achada = parsed.data.competencias.find((x) => Math.round(x.numero) === c.numero);
    return {
      numero: c.numero,
      nota: Math.min(NOTA_MAX_COMPETENCIA, Math.max(0, Math.round(achada?.nota ?? 0))),
      comentario: achada?.comentario?.trim() || "Sem comentário para esta competência.",
    };
  });

  // O total e SOMADO aqui, nao aceito do modelo: ele erra a conta com alguma
  // frequencia, e uma nota que nao bate com as partes destroi a confianca em
  // toda a correcao.
  const total = notas.reduce((soma, n) => soma + n.nota, 0);

  const criada = await prisma.redacao.create({
    data: {
      texto,
      palavras,
      userId,
      temaId: tema.id,
      corrigidaEm: new Date(),
      total,
      resumo: parsed.data.resumo?.trim() || null,
      pontosFortes:
        (parsed.data.pontosFortes ?? []).map((s) => s.trim()).filter(Boolean).join("\n") || null,
      aMelhorar:
        (parsed.data.aMelhorar ?? []).map((s) => s.trim()).filter(Boolean).join("\n") || null,
      competencias: { create: notas },
    },
    include: {
      competencias: { orderBy: { numero: "asc" } },
      tema: { select: { tema: true } },
    },
  });

  revalidatePath("/redacao");
  return paraRedacaoDTO(criada);
}

type RedacaoComRelacoes = {
  id: string;
  temaId: string;
  texto: string;
  palavras: number;
  enviadaEm: Date;
  total: number | null;
  resumo: string | null;
  pontosFortes: string | null;
  aMelhorar: string | null;
  tema: { tema: string };
  competencias: { numero: number; nota: number; comentario: string }[];
};

function paraRedacaoDTO(r: RedacaoComRelacoes): RedacaoDTO {
  const linhas = (s: string | null) => (s ? s.split("\n").filter(Boolean) : []);
  return {
    id: r.id,
    temaId: r.temaId,
    tema: r.tema.tema,
    texto: r.texto,
    palavras: r.palavras,
    enviadaEm: r.enviadaEm.toISOString(),
    total: r.total,
    resumo: r.resumo,
    pontosFortes: linhas(r.pontosFortes),
    aMelhorar: linhas(r.aMelhorar),
    competencias: r.competencias.map((c) => ({
      numero: c.numero,
      nota: c.nota,
      comentario: c.comentario,
    })),
  };
}

/** Historico de quem esta logada. Redacao e privada: filtrado por userId. */
export async function listarMinhasRedacoes(): Promise<RedacaoDTO[]> {
  const userId = await exigirUsuario();
  const rs = await prisma.redacao.findMany({
    where: { userId },
    orderBy: { enviadaEm: "desc" },
    take: 30,
    include: {
      competencias: { orderBy: { numero: "asc" } },
      tema: { select: { tema: true } },
    },
  });
  return rs.map(paraRedacaoDTO);
}
