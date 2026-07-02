import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";

// "Resumos por legislacao" e "modo de leitura da lei com questoes relacionadas".
// Cada Assunto representa uma legislacao/tema. O resumo NAO e fixo no banco: e
// derivado ao vivo das explicacoes e bases legais das proprias questoes daquele
// assunto (conteudo ancorado, sem inventar texto de lei).

export type LegislacaoResumo = {
  id: string;
  nome: string;
  descricao: string | null;
  materia: string;
  totalQuestoes: number;
  respondidas: number;
  revisoesPendentes: number;
};

export type SecaoResumo = {
  titulo: string;
  fontes: string[];
  pontos: string[];
};

export type LegislacaoDetalhe = {
  id: string;
  nome: string;
  descricao: string | null;
  totalQuestoes: number;
  fontesLegais: string[];
  secoes: SecaoResumo[];
};

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  return session.user.id;
}

/** Lista as legislacoes (assuntos) com progresso do usuario. */
export async function listarLegislacoes(): Promise<LegislacaoResumo[]> {
  const userId = await getUserId();
  const agora = new Date();
  const concursoId = await getConcursoAtualId();

  const assuntos = await prisma.assunto.findMany({
    where: { concursoId },
    orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
    select: {
      id: true,
      nome: true,
      descricao: true,
      materia: { select: { nome: true } },
      _count: { select: { questoes: true } },
    },
  });

  // Progresso por assunto: questoes distintas respondidas e revisoes vencidas.
  const [respostas, revisoes] = await Promise.all([
    prisma.resposta.findMany({
      where: { userId, questao: { concursoId } },
      select: { questaoId: true, questao: { select: { assuntoId: true } } },
      distinct: ["questaoId"],
    }),
    prisma.revisao.findMany({
      where: { userId, proximaData: { lte: agora }, questao: { concursoId } },
      select: { questao: { select: { assuntoId: true } } },
    }),
  ]);

  const respPorAssunto = new Map<string, number>();
  for (const r of respostas) {
    const a = r.questao.assuntoId;
    respPorAssunto.set(a, (respPorAssunto.get(a) ?? 0) + 1);
  }
  const revPorAssunto = new Map<string, number>();
  for (const r of revisoes) {
    const a = r.questao.assuntoId;
    revPorAssunto.set(a, (revPorAssunto.get(a) ?? 0) + 1);
  }

  return assuntos.map((a) => ({
    id: a.id,
    nome: a.nome,
    descricao: a.descricao,
    materia: a.materia?.nome ?? "Outros",
    totalQuestoes: a._count.questoes,
    respondidas: respPorAssunto.get(a.id) ?? 0,
    revisoesPendentes: revPorAssunto.get(a.id) ?? 0,
  }));
}

/**
 * Normaliza uma explicacao para virar um "ponto" do resumo. Usa o texto
 * completo (nao tenta cortar na 1a frase: o texto juridico tem muitas
 * abreviacoes com ponto — "art.", "LC", "§", "8.742" — que quebrariam a frase
 * no meio). So trunca se ficar muito longo, sempre no fim de uma palavra.
 */
function resumirPonto(texto: string): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const MAX = 360;
  if (limpo.length <= MAX) return limpo;
  const corte = limpo.lastIndexOf(" ", MAX);
  return limpo.slice(0, corte > 0 ? corte : MAX).trimEnd() + "…";
}

/** Monta o resumo derivado + dados de leitura de uma legislacao (assunto). */
export async function getLegislacao(assuntoId: string): Promise<LegislacaoDetalhe | null> {
  await getUserId();

  const assunto = await prisma.assunto.findUnique({
    where: { id: assuntoId },
    select: { id: true, nome: true, descricao: true },
  });
  if (!assunto) return null;

  const questoes = await prisma.questao.findMany({
    where: { assuntoId },
    select: {
      explicacao: true,
      fonteLegal: true,
      subassunto: { select: { nome: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Agrupa por subassunto -> pontos (frases distintas) + fontes legais distintas.
  const grupos = new Map<string, { pontos: Set<string>; fontes: Set<string> }>();
  const fontesGerais = new Set<string>();

  for (const q of questoes) {
    const titulo = q.subassunto?.nome ?? "Visão geral";
    if (!grupos.has(titulo)) grupos.set(titulo, { pontos: new Set(), fontes: new Set() });
    const g = grupos.get(titulo)!;
    if (q.explicacao) g.pontos.add(resumirPonto(q.explicacao));
    if (q.fonteLegal) {
      g.fontes.add(q.fonteLegal.trim());
      fontesGerais.add(q.fonteLegal.trim());
    }
  }

  const secoes: SecaoResumo[] = [...grupos.entries()]
    .map(([titulo, g]) => ({
      titulo,
      // Limita para um resumo legivel.
      pontos: [...g.pontos].slice(0, 8),
      fontes: [...g.fontes].slice(0, 10),
    }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt"));

  return {
    id: assunto.id,
    nome: assunto.nome,
    descricao: assunto.descricao,
    totalQuestoes: questoes.length,
    fontesLegais: [...fontesGerais].sort((a, b) => a.localeCompare(b, "pt")).slice(0, 16),
    secoes,
  };
}
