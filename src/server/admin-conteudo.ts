"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";
import { NIVEIS } from "@/lib/utils";

// Cadastro de conteudo pelo admin: materias, assuntos e questoes (uma a uma ou
// em lote via JSON). Tudo escopado ao concurso atualmente selecionado.

async function exigirAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Acesso restrito a administradores.");
}

async function concursoAtual(): Promise<string> {
  const id = await getConcursoAtualId();
  if (!id) throw new Error("Nenhum concurso selecionado.");
  return id;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------- listagem

export type ConteudoAdmin = {
  concursoNome: string;
  materias: { id: string; nome: string }[];
  assuntos: { id: string; nome: string; materia: string | null }[];
};

/** Materias e assuntos do concurso atual, para popular os selects dos forms. */
export async function listarConteudo(): Promise<ConteudoAdmin> {
  await exigirAdmin();
  const concursoId = await concursoAtual();

  const [concurso, materias, assuntos] = await Promise.all([
    prisma.concurso.findUnique({ where: { id: concursoId }, select: { nome: true } }),
    prisma.materia.findMany({
      where: { concursoId },
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.assunto.findMany({
      where: { concursoId },
      orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
      select: { id: true, nome: true, materia: { select: { nome: true } } },
    }),
  ]);

  return {
    concursoNome: concurso?.nome ?? "—",
    materias,
    assuntos: assuntos.map((a) => ({ id: a.id, nome: a.nome, materia: a.materia?.nome ?? null })),
  };
}

// ---------------------------------------------------------------- materia

export async function criarMateria(input: { nome: string; descricao?: string }): Promise<void> {
  await exigirAdmin();
  const concursoId = await concursoAtual();

  const nome = input.nome?.trim();
  if (!nome) throw new Error("Informe o nome da matéria.");

  const existe = await prisma.materia.findFirst({ where: { concursoId, nome }, select: { id: true } });
  if (existe) throw new Error("Já existe uma matéria com esse nome neste concurso.");

  const ordem = await prisma.materia.count({ where: { concursoId } });
  await prisma.materia.create({
    data: { nome, descricao: input.descricao?.trim() || null, ordem, concursoId },
  });

  revalidatePath("/admin/conteudo");
  revalidatePath("/estudar");
}

// ---------------------------------------------------------------- assunto

export async function criarAssunto(input: {
  nome: string;
  descricao?: string;
  materiaId: string;
}): Promise<void> {
  await exigirAdmin();
  const concursoId = await concursoAtual();

  const nome = input.nome?.trim();
  if (!nome) throw new Error("Informe o nome do assunto.");

  const materia = await prisma.materia.findFirst({
    where: { id: input.materiaId, concursoId },
    select: { id: true },
  });
  if (!materia) throw new Error("Selecione uma matéria válida.");

  const existe = await prisma.assunto.findFirst({ where: { concursoId, nome }, select: { id: true } });
  if (existe) throw new Error("Já existe um assunto com esse nome neste concurso.");

  const ordem = await prisma.assunto.count({ where: { concursoId } });
  await prisma.assunto.create({
    data: { nome, descricao: input.descricao?.trim() || null, ordem, materiaId: materia.id, concursoId },
  });

  revalidatePath("/admin/conteudo");
  revalidatePath("/estudar");
}

// ---------------------------------------------------------------- questao (uma)

type AlternativaInput = { texto: string; correta: boolean };

/** Valida alternativas: >=2, todas com texto, exatamente uma correta. */
function validarAlternativas(alts: AlternativaInput[]): AlternativaInput[] {
  const limpas = (alts ?? []).map((a) => ({ texto: (a.texto ?? "").trim(), correta: !!a.correta }));
  if (limpas.length < 2) throw new Error("Inclua ao menos 2 alternativas.");
  if (limpas.some((a) => !a.texto)) throw new Error("Nenhuma alternativa pode ficar vazia.");
  if (limpas.filter((a) => a.correta).length !== 1) {
    throw new Error("Marque exatamente uma alternativa como correta.");
  }
  return limpas;
}

export async function criarQuestao(input: {
  assuntoId: string;
  subassunto?: string;
  enunciado: string;
  nivel: string;
  banca?: string;
  explicacao: string;
  fonteLegal?: string;
  dificuldade?: number;
  palavrasChave?: string; // separadas por virgula
  alternativas: AlternativaInput[];
}): Promise<void> {
  await exigirAdmin();
  const concursoId = await concursoAtual();

  const assunto = await prisma.assunto.findFirst({
    where: { id: input.assuntoId, concursoId },
    select: { id: true },
  });
  if (!assunto) throw new Error("Selecione um assunto válido.");

  const enunciado = input.enunciado?.trim();
  const explicacao = input.explicacao?.trim();
  if (!enunciado) throw new Error("O enunciado não pode ficar vazio.");
  if (!explicacao) throw new Error("A explicação não pode ficar vazia.");
  if (!NIVEIS.includes(input.nivel as (typeof NIVEIS)[number])) throw new Error("Nível inválido.");

  const alts = validarAlternativas(input.alternativas);

  const jaExiste = await prisma.questao.findFirst({
    where: { concursoId, enunciado },
    select: { id: true },
  });
  if (jaExiste) throw new Error("Já existe uma questão com esse enunciado neste concurso.");

  const subassuntoId = await resolverSubassunto(assunto.id, input.subassunto);
  const palavras =
    input.palavrasChave
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ") || null;

  await prisma.questao.create({
    data: {
      enunciado,
      explicacao,
      nivel: input.nivel,
      banca: input.banca?.trim() || "QUADRIX",
      fonteLegal: input.fonteLegal?.trim() || null,
      dificuldade: clampDificuldade(input.dificuldade),
      palavrasChave: palavras,
      concursoId,
      assuntoId: assunto.id,
      subassuntoId,
      alternativas: { create: alts.map((a, i) => ({ texto: a.texto, correta: a.correta, ordem: i })) },
    },
  });

  revalidatePath("/admin/conteudo");
}

// ---------------------------------------------------------------- questoes (lote JSON)

export type ResultadoImport = { criadas: number; ignoradas: number; erros: string[] };

const alternativaSchema = z.object({
  texto: z.string(),
  correta: z.boolean(),
});

const questaoJsonSchema = z.object({
  assunto: z.string(),
  subassunto: z.string().nullish(),
  enunciado: z.string(),
  nivel: z.string().nullish(),
  banca: z.string().nullish(),
  explicacao: z.string(),
  fonteLegal: z.string().nullish(),
  dificuldade: z.number().nullish(),
  palavrasChave: z.array(z.string()).nullish(),
  alternativas: z.array(alternativaSchema),
});

/**
 * Importa questoes em lote a partir de um JSON (array de objetos, ou um objeto
 * unico). Cada item referencia o `assunto` pelo NOME (deve existir no concurso).
 * Questoes com enunciado ja existente sao ignoradas; erros por item nao
 * interrompem o restante — sao devolvidos na lista `erros`.
 */
export async function importarQuestoes(jsonText: string): Promise<ResultadoImport> {
  await exigirAdmin();
  const concursoId = await concursoAtual();

  let bruto: unknown;
  try {
    bruto = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON inválido — verifique a formatação (aspas, vírgulas, colchetes).");
  }

  const arr = Array.isArray(bruto) ? bruto : [bruto];
  const parsed = z.array(questaoJsonSchema).safeParse(arr);
  if (!parsed.success) {
    const amostra = parsed.error.issues
      .slice(0, 5)
      .map((i) => `item ${Number(i.path[0]) + 1} (${i.path.slice(1).join(".") || "?"}): ${i.message}`)
      .join("; ");
    throw new Error(`Formato inválido. ${amostra}`);
  }
  const itens = parsed.data;
  if (itens.length === 0) throw new Error("O JSON não contém nenhuma questão.");

  const assuntosDb = await prisma.assunto.findMany({
    where: { concursoId },
    select: { id: true, nome: true },
  });
  const assuntoMap = new Map(assuntosDb.map((a) => [a.nome, a.id]));

  const existentes = new Set(
    (await prisma.questao.findMany({ where: { concursoId }, select: { enunciado: true } })).map((q) =>
      norm(q.enunciado)
    )
  );

  const erros: string[] = [];
  let criadas = 0;
  let ignoradas = 0;

  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    const pos = `#${i + 1}`;

    const enunciado = it.enunciado.trim();
    const explicacao = it.explicacao.trim();
    if (!enunciado || !explicacao) {
      erros.push(`${pos}: enunciado e explicação são obrigatórios.`);
      continue;
    }

    const nivel = it.nivel?.trim() || "Medio";
    if (!NIVEIS.includes(nivel as (typeof NIVEIS)[number])) {
      erros.push(`${pos}: nível "${nivel}" inválido (use Facil, Medio ou Dificil).`);
      continue;
    }

    let alts: AlternativaInput[];
    try {
      alts = validarAlternativas(it.alternativas);
    } catch (e) {
      erros.push(`${pos}: ${e instanceof Error ? e.message : "alternativas inválidas."}`);
      continue;
    }

    const assuntoId = assuntoMap.get(it.assunto.trim());
    if (!assuntoId) {
      erros.push(`${pos}: assunto "${it.assunto}" não existe neste concurso — crie-o antes.`);
      continue;
    }

    if (existentes.has(norm(enunciado))) {
      ignoradas++;
      continue;
    }

    const subassuntoId = await resolverSubassunto(assuntoId, it.subassunto ?? undefined);

    await prisma.questao.create({
      data: {
        enunciado,
        explicacao,
        nivel,
        banca: it.banca?.trim() || "QUADRIX",
        fonteLegal: it.fonteLegal?.trim() || null,
        dificuldade: clampDificuldade(it.dificuldade ?? undefined),
        palavrasChave: it.palavrasChave?.map((s) => s.trim()).filter(Boolean).join(", ") || null,
        concursoId,
        assuntoId,
        subassuntoId,
        alternativas: { create: alts.map((a, idx) => ({ texto: a.texto, correta: a.correta, ordem: idx })) },
      },
    });
    existentes.add(norm(enunciado));
    criadas++;
  }

  revalidatePath("/admin/conteudo");
  return { criadas, ignoradas, erros };
}

// ---------------------------------------------------------------- helpers

function clampDificuldade(d?: number): number {
  if (typeof d !== "number" || Number.isNaN(d)) return 3;
  return Math.min(5, Math.max(1, Math.round(d)));
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
