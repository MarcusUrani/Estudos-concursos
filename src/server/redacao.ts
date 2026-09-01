"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  conversarGroq,
  extrairObjetoJson,
  extrairArrayJson,
  modeloGroqComBusca,
  modeloGroqTexto,
  ErroGroq,
} from "@/lib/groq";
import { extrairTrechoDaPagina } from "@/lib/verificar-citacao";
import {
  PROMPT_FONTES,
  PROMPT_PROPOSTA,
  PROMPT_CORRECAO,
  montarPedidoFontes,
  assuntoDaBusca,
  montarPedidoProposta,
  montarPedidoCorrecao,
  CRITERIOS,
  NOTA_MAX_CRITERIO,
  notaFinal,
  estimarLinhas,
  comandoPadrao,
  LINHAS_MIN,
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

export type CriterioDTO = {
  numero: number;
  sigla: string;
  titulo: string;
  peso: number;
  /** 0 a 3, inteiro. */
  nota: number;
  comentario: string;
};

export type RedacaoDTO = {
  id: string;
  temaId: string;
  tema: string;
  texto: string;
  palavras: number;
  enviadaEm: string;
  /** Nota de 0 a 100 pela formula do edital. Pode ter casas decimais. */
  total: number | null;
  linhas: number;
  resumo: string | null;
  pontosFortes: string[];
  aMelhorar: string[];
  criterios: CriterioDTO[];
};

// ---------------------------------------------------------------- geracao do tema

const fonteSchema = z.object({
  url: z.string(),
  veiculo: z.string().nullish(),
  // Pedimos o titulo so para OBRIGAR o modelo a de fato abrir a pagina: sem
  // nada para relatar, ele respondia "nao consigo acessar a web" e devolvia
  // lista vazia. O titulo em si nao e usado.
  titulo: z.string().nullish(),
});

/** Passo 1: so os enderecos. O trecho e recortado por nos, da propria pagina. */
const fontesSchema = z.object({
  fontes: z.array(fonteSchema).nullish(),
  urls: z.array(fonteSchema).nullish(),
  textos: z.array(fonteSchema).nullish(),
});

/** Passo 2: a proposta escrita a partir das fontes ja conferidas. */
const propostaSchema = z.object({
  tema: z.string(),
  comando: z.string(),
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
   * igualmente inventados, e uma delas com fala atribuida a uma pessoa real.
   * Marcar como "nao conferida" e deixar passar nao resolve: quem estuda sob
   * pressao usa o que esta na tela, e citar dado falso na prova e pior do que
   * nao citar nada.
   */
  let ultimoMotivo = "";

  for (let rodada = 0; rodada < 2; rodada++) {
    // Uma rodada ruim (resposta fora de formato, busca vazia) nao derruba a
    // geracao: o modelo de busca e instavel e a rodada seguinte costuma vir
    // limpa. So desistimos quando as duas falham.
    let candidatos: Candidato[] = [];
    try {
      candidatos = await buscarFontes(concurso.nome, input, inicio);
    } catch (e) {
      ultimoMotivo = e instanceof Error ? e.message : "falha na busca";
      if (Date.now() - inicio > 28_000) break;
      continue;
    }
    if (candidatos.length === 0) {
      ultimoMotivo = "a busca não retornou nenhuma fonte";
      if (Date.now() - inicio > 28_000) break;
      continue;
    }

    // O trecho vem da PAGINA, nao do modelo: por isso nao existe "citacao nao
    // conferida" aqui — ou conseguimos ler a pagina e recortar um paragrafo,
    // ou a fonte simplesmente nao entra.
    const assunto = assuntoDaBusca({ concurso: concurso.nome, orientacao: input.orientacao });
    const lidas = await Promise.all(
      candidatos.map(async (c) => {
        const r = await extrairTrechoDaPagina(c.url, assunto);
        return "trecho" in r
          ? { url: c.url, veiculo: c.veiculo, trecho: r.trecho, ok: true as const }
          : { url: c.url, veiculo: c.veiculo, trecho: "", ok: false as const, motivo: r.erro };
      })
    );
    const validos = lidas.filter((c) => c.ok).slice(0, 2);

    if (validos.length > 0) {
      const proposta = await redigirProposta(concurso.nome, input, validos);

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

    ultimoMotivo = lidas.map((c) => (c.ok ? "ok" : c.motivo)).join("; ");
    if (Date.now() - inicio > 28_000) break;
  }

  throw new ErroGroq(
    "Não consegui confirmar nenhuma fonte real para este tema — as páginas citadas não abriram ou o trecho não estava nelas. " +
      "Nenhuma proposta foi salva. Tente de novo, ou use o campo de orientação para apontar um assunto mais noticiado. " +
      `(motivos: ${ultimoMotivo || "sem candidatos"})`
  );
}

type Candidato = { trecho: string; veiculo: string; url: string };

/**
 * Passo 1 — busca na web.
 *
 * O pedido e curto de proposito: com o prompt longo que existia antes, este
 * modelo respondia 413 sistematicamente (ver o comentario em
 * `lib/redacao-prompt.ts`). Aqui ele so acha fonte e copia trecho.
 */
async function buscarFontes(
  concursoNome: string,
  input: { orientacao?: string },
  inicio: number
): Promise<Candidato[]> {
  const orcamento = Math.max(8_000, 30_000 - (Date.now() - inicio));

  const { texto } = await conversarGroq({
    modelo: modeloGroqComBusca(),
    tentativas: 2,
    timeoutMs: orcamento,
    orcamentoMs: orcamento,
    temperatura: 0.6,
    // A resposta agora e so uma lista de URLs: cabe folgada em 700 tokens, e
    // reservar pouco e o que mantem a chamada dentro da cota por minuto.
    maxTokens: 700,
    sistema: PROMPT_FONTES,
    usuario: montarPedidoFontes({ concurso: concursoNome, orientacao: input.orientacao }),
  });

  let lista: unknown[];
  try {
    const obj = fontesSchema.safeParse(extrairObjetoJson(texto));
    if (!obj.success) throw new Error("envelope inesperado");
    lista = obj.data.fontes ?? obj.data.urls ?? obj.data.textos ?? [];
  } catch {
    try {
      lista = extrairArrayJson(texto);
    } catch {
      return [];
    }
  }

  const itens = z.array(fonteSchema).safeParse(lista);
  if (!itens.success) return [];

  const vistas = new Set<string>();
  return itens.data
    .map((t) => ({
      veiculo: t.veiculo?.trim() || dominioDe(t.url),
      url: t.url.trim(),
      trecho: "",
    }))
    .filter((t) => {
      if (!t.url.startsWith("http")) return false;
      const chave = t.url.replace(/[#?].*$/, "");
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    })
    .slice(0, 5);
}

/** Nome de exibicao quando o modelo nao informa o veiculo. */
function dominioDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\d?\./, "");
  } catch {
    return "Fonte";
  }
}

/**
 * Passo 2 — redige tema e comando, SEM busca.
 *
 * Recebe as fontes ja conferidas, entao o comando pode dialogar com o que a
 * pessoa vai ter na frente. Modelo padrao (sem busca): mais forte para escrever
 * e sem o risco de estourar o contexto.
 */
async function redigirProposta(
  concursoNome: string,
  input: { banca?: string; orientacao?: string },
  textos: Candidato[]
): Promise<{ tema: string; comando: string }> {
  const { texto } = await conversarGroq({
    // Cota separada da busca — ver `modeloGroqTexto`.
    modelo: modeloGroqTexto(),
    temperatura: 0.7,
    maxTokens: 900,
    // Passo curto, mas com direito a esperar uma cota estourada: seria uma pena
    // perder as fontes ja conferidas por causa de um 429 de poucos segundos.
    tentativas: 2,
    timeoutMs: 14_000,
    orcamentoMs: 16_000,
    sistema: PROMPT_PROPOSTA,
    usuario: montarPedidoProposta({
      concurso: concursoNome,
      banca: input.banca,
      orientacao: input.orientacao,
      textos: textos.map((t) => ({ trecho: t.trecho, veiculo: t.veiculo })),
    }),
  });

  const parsed = propostaSchema.safeParse(extrairObjetoJson(texto));
  if (!parsed.success) {
    throw new ErroGroq("A proposta veio em formato inesperado. Tente gerar de novo.");
  }
  const tema = parsed.data.tema.trim();
  const comando = parsed.data.comando.trim();
  if (!tema || !comando) throw new ErroGroq("A proposta veio incompleta. Tente de novo.");
  return { tema, comando };
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
    // `externo` e o tema que alguem trouxe de fora para corrigir um texto
    // proprio. Nao e proposta curada do concurso e nao entra nesta lista.
    where: { concursoId, externo: false },
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

const criterioSchema = z.object({
  sigla: z.string().nullish(),
  numero: z.coerce.number().nullish(),
  nota: z.coerce.number(),
  comentario: z.string().nullish(),
});

const correcaoSchema = z.object({
  criterios: z.array(criterioSchema).nullish(),
  competencias: z.array(criterioSchema).nullish(),
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

/* -----------------------------------------------------------------------------
   Conteudo programatico do concurso

   O CAC vale 70% da nota e avalia "pertinencia, consistencia e suficiencia das
   informacoes". Julgar isso sem saber o que o concurso cobra e julgar no vacuo:
   o corretor elogia repertorio generico e deixa passar erro conceitual numa lei
   que a pessoa vai ter na prova objetiva.

   Entao a correcao recebe a arvore de materias e assuntos do proprio concurso —
   a mesma que alimenta o treino. Nao vira checklist: o prompt diz explicitamente
   para nao exigir citacao de item nenhum. Serve para o corretor saber o que e
   pertinente ali e o que esta factualmente errado.
   ----------------------------------------------------------------------------- */

async function conteudoProgramatico(concursoId: string | null): Promise<string[]> {
  if (!concursoId) return [];
  const materias = await prisma.materia.findMany({
    where: { concursoId },
    orderBy: { ordem: "asc" },
    select: {
      nome: true,
      assuntos: { orderBy: { ordem: "asc" }, select: { nome: true } },
    },
  });
  return materias
    .filter((m) => m.assuntos.length > 0)
    .map((m) => `- ${m.nome}: ${m.assuntos.map((a) => a.nome).join("; ")}`);
}

type Avaliacao = {
  notas: { numero: number; nota: number; comentario: string }[];
  resumo: string | null;
  pontosFortes: string | null;
  aMelhorar: string | null;
};

/**
 * Uma correcao: chama o modelo e devolve as notas ja na escala do edital.
 *
 * Compartilhada pelos dois caminhos — a redacao escrita sobre proposta da
 * plataforma e a que a pessoa trouxe pronta. Sao a mesma prova para o corretor;
 * so muda de onde veio o tema.
 */
async function avaliar(p: {
  tema: string;
  comando: string;
  texto: string;
  linhas: number;
  conteudo: string[];
}): Promise<Avaliacao> {
  const { texto: bruto } = await conversarGroq({
    // Correcao NAO usa busca: e leitura fechada do que a pessoa escreveu, e
    // busca so abriria espaco para o modelo inventar contexto.
    temperatura: 0.3,
    maxTokens: 2500,
    sistema: PROMPT_CORRECAO,
    usuario: montarPedidoCorrecao(p),
  });

  const parsed = correcaoSchema.safeParse(extrairObjetoJson(bruto));
  if (!parsed.success) {
    throw new ErroGroq("A correção veio em formato inesperado. Tente enviar novamente.");
  }

  // Sempre os tres criterios, sempre inteiros de 0 a 3. O modelo as vezes pula
  // um, manda fracao ou estoura o teto; aqui a escala do edital e garantida.
  const devolvidos = parsed.data.criterios ?? parsed.data.competencias ?? [];
  const notas = CRITERIOS.map((c) => {
    const achado = devolvidos.find(
      (x) =>
        x.sigla?.trim().toUpperCase() === c.sigla ||
        (x.numero != null && Math.round(x.numero) === c.numero)
    );
    return {
      numero: c.numero,
      nota: Math.min(NOTA_MAX_CRITERIO, Math.max(0, Math.round(achado?.nota ?? 0))),
      comentario: achado?.comentario?.trim() || "Sem comentário para este critério.",
    };
  });

  const umaPorLinha = (xs: string[] | null | undefined) =>
    (xs ?? [])
      .map((x) => x.trim())
      .filter(Boolean)
      .join(String.fromCharCode(10)) || null;

  return {
    notas,
    resumo: parsed.data.resumo?.trim() || null,
    pontosFortes: umaPorLinha(parsed.data.pontosFortes),
    aMelhorar: umaPorLinha(parsed.data.aMelhorar),
  };
}

/**
 * Item 13.3.4.5 "e": abaixo do minimo de linhas a prova recebe zero. Barramos
 * antes de gastar a correcao — a pessoa ja sabe o resultado, e ler o aviso
 * ensina o mesmo que receber o zero.
 */
function exigirExtensao(linhas: number): void {
  if (linhas < LINHAS_MIN) {
    throw new Error(
      `O edital exige no mínimo ${LINHAS_MIN} linhas e esta redação tem cerca de ${linhas}. ` +
        "Na prova real, texto abaixo do mínimo recebe nota zero."
    );
  }
}

async function gravar(p: {
  userId: string;
  temaId: string;
  texto: string;
  linhas: number;
  avaliacao: Avaliacao;
}): Promise<RedacaoDTO> {
  // A nota final sai da FORMULA do edital, nunca do modelo: ele erra conta com
  // frequencia, e aqui a conta tem peso diferente por criterio e ainda regra de
  // zeramento. Nota que nao bate com as partes destroi a confianca na correcao.
  const total = notaFinal(p.avaliacao.notas);

  const criada = await prisma.redacao.create({
    data: {
      texto: p.texto,
      // A coluna `palavras` guarda a estimativa de LINHAS: o edital conta linha,
      // nao palavra. Renomear a coluna exigiria migration sem ganho nenhum.
      palavras: p.linhas,
      userId: p.userId,
      temaId: p.temaId,
      corrigidaEm: new Date(),
      // A coluna e inteira; o valor exato com casas decimais e recalculado a
      // partir dos criterios em `paraRedacaoDTO`.
      total: Math.round(total),
      resumo: p.avaliacao.resumo,
      pontosFortes: p.avaliacao.pontosFortes,
      aMelhorar: p.avaliacao.aMelhorar,
      competencias: { create: p.avaliacao.notas },
    },
    include: {
      competencias: { orderBy: { numero: "asc" } },
      tema: { select: { tema: true } },
    },
  });

  revalidatePath("/redacao");
  return paraRedacaoDTO(criada);
}

async function corrigir(input: { temaId: string; texto: string }): Promise<RedacaoDTO> {
  const userId = await exigirUsuario();

  const texto = input.texto?.trim() ?? "";
  const linhas = estimarLinhas(texto);
  exigirExtensao(linhas);

  const tema = await prisma.temaRedacao.findUnique({
    where: { id: input.temaId },
    select: { id: true, tema: true, comando: true, concursoId: true },
  });
  if (!tema) throw new Error("Tema não encontrado.");

  const avaliacao = await avaliar({
    tema: tema.tema,
    comando: tema.comando,
    texto,
    linhas,
    conteudo: await conteudoProgramatico(tema.concursoId),
  });

  return gravar({ userId, temaId: tema.id, texto, linhas, avaliacao });
}

/* -----------------------------------------------------------------------------
   Redacao trazida de fora

   Quem ja escreveu sobre um tema que nao saiu daqui nao tinha como aproveitar a
   correcao — toda redacao exige um tema no banco. Esta acao cria esse tema a
   partir do que a pessoa informou, marcado como `externo` para nao virar
   proposta do concurso, e corrige pelos mesmos criterios do edital.
   ----------------------------------------------------------------------------- */

export async function corrigirRedacaoExterna(input: {
  concursoId: string;
  tema: string;
  texto: string;
}): Promise<Resultado<RedacaoDTO>> {
  try {
    return { ok: true, dados: await corrigirExterna(input) };
  } catch (e) {
    return falha("corrigirRedacaoExterna", e);
  }
}

async function corrigirExterna(input: {
  concursoId: string;
  tema: string;
  texto: string;
}): Promise<RedacaoDTO> {
  const userId = await exigirUsuario();

  const tema = input.tema?.trim() ?? "";
  const texto = input.texto?.trim() ?? "";
  if (tema.length < 5) throw new Error("Informe o tema da redação.");

  const linhas = estimarLinhas(texto);
  exigirExtensao(linhas);

  const concurso = await prisma.concurso.findUnique({
    where: { id: input.concursoId },
    select: { id: true },
  });
  if (!concurso) throw new Error("Selecione um concurso válido.");

  // O comando e nosso: quem cola um texto pronto informa o TEMA, e o comando
  // original pode nem existir. E contra este comando que o CAC vai medir, entao
  // a tela mostra ele junto do resultado.
  const comando = comandoPadrao(tema);

  const avaliacao = await avaliar({
    tema,
    comando,
    texto,
    linhas,
    conteudo: await conteudoProgramatico(concurso.id),
  });

  // O tema so e gravado depois de a correcao dar certo: se a chamada falhar,
  // nao fica tema orfao no banco.
  const criado = await prisma.temaRedacao.create({
    data: { tema, comando, externo: true, concursoId: concurso.id, autorId: userId },
    select: { id: true },
  });

  return gravar({ userId, temaId: criado.id, texto, linhas, avaliacao });
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
  const emLinhas = (s: string | null) =>
    s ? s.split(String.fromCharCode(10)).filter(Boolean) : [];

  const criterios: CriterioDTO[] = CRITERIOS.map((c) => {
    const salvo = r.competencias.find((x) => x.numero === c.numero);
    return {
      numero: c.numero,
      sigla: c.sigla,
      titulo: c.titulo,
      peso: c.peso,
      nota: salvo?.nota ?? 0,
      comentario: salvo?.comentario ?? "",
    };
  });

  return {
    id: r.id,
    temaId: r.temaId,
    tema: r.tema.tema,
    texto: r.texto,
    palavras: r.palavras,
    // A coluna `palavras` guarda a estimativa de LINHAS — ver o comentario na
    // gravacao. Exposto com o nome certo aqui.
    linhas: r.palavras,
    enviadaEm: r.enviadaEm.toISOString(),
    // Recalculado a partir dos criterios: a coluna guarda so o inteiro
    // arredondado, e a formula do edital produz valor quebrado (66,67 etc.).
    total: r.total === null ? null : notaFinal(criterios),
    resumo: r.resumo,
    pontosFortes: emLinhas(r.pontosFortes),
    aMelhorar: emLinhas(r.aMelhorar),
    criterios,
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
