import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";

export type Conquista = {
  id: string;
  titulo: string;
  descricao: string;
  icone: string; // chave mapeada para um icone no cliente
  desbloqueada: boolean;
  atual?: number; // progresso atual (conquistas de meta numerica)
  alvo?: number;
};

export type Gamificacao = {
  xp: number;
  nivel: number;
  xpNoNivel: number; // xp acumulado dentro do nivel atual
  xpProximoNivel: number; // xp necessario para subir de nivel
  streak: number; // dias seguidos estudando
  respondidas: number;
  acertos: number;
  percentualGeral: number;
  simuladosFeitos: number;
  conquistas: Conquista[];
};

// XP: cada questao vale 2, cada acerto soma +8 (acerto = 10, erro = 2),
// cada simulado concluido rende +25.
const XP_RESPOSTA = 2;
const XP_ACERTO = 8;
const XP_SIMULADO = 25;

/** Nivel e progresso a partir do XP. Custo do nivel cresce 50 a cada nivel. */
function nivelInfo(xp: number) {
  let nivel = 1;
  let restante = xp;
  let custo = 100;
  while (restante >= custo) {
    restante -= custo;
    nivel++;
    custo += 50;
  }
  return { nivel, xpNoNivel: restante, xpProximoNivel: custo };
}

function chaveDia(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Conta quantos dias seguidos (terminando hoje ou ontem) houve atividade. */
function calcularStreak(datas: Date[]): number {
  if (datas.length === 0) return 0;
  const dias = new Set(datas.map(chaveDia));
  const cursor = new Date();
  // Se ainda nao estudou hoje, o streak pode terminar ontem.
  if (!dias.has(chaveDia(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dias.has(chaveDia(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getGamificacao(): Promise<Gamificacao> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = session.user.id;
  const concursoId = await getConcursoAtualId();

  const [respostas, simulados] = await Promise.all([
    prisma.resposta.findMany({
      where: { userId, questao: { concursoId } },
      select: { acertou: true, respondidaEm: true },
    }),
    prisma.simulado.findMany({
      where: { userId, concursoId },
      select: { total: true, acertos: true },
    }),
  ]);

  const respondidas = respostas.length;
  const acertos = respostas.filter((r) => r.acertou).length;
  const percentualGeral = respondidas ? Math.round((acertos / respondidas) * 100) : 0;
  const simuladosFeitos = simulados.length;

  const xp = respondidas * XP_RESPOSTA + acertos * XP_ACERTO + simuladosFeitos * XP_SIMULADO;
  const { nivel, xpNoNivel, xpProximoNivel } = nivelInfo(xp);
  const streak = calcularStreak(respostas.map((r) => r.respondidaEm));

  const gabaritou = simulados.some((s) => s.total >= 10 && s.acertos === s.total);
  const pontaria = respondidas >= 20 && percentualGeral >= 80;

  const conquistas: Conquista[] = [
    {
      id: "primeira-resposta",
      titulo: "Primeiros passos",
      descricao: "Responda sua primeira questão",
      icone: "footprints",
      desbloqueada: respondidas >= 1,
      atual: Math.min(respondidas, 1),
      alvo: 1,
    },
    {
      id: "cinquenta",
      titulo: "Aquecimento",
      descricao: "Responda 50 questões",
      icone: "flame",
      desbloqueada: respondidas >= 50,
      atual: Math.min(respondidas, 50),
      alvo: 50,
    },
    {
      id: "duzentos-cinquenta",
      titulo: "Maratonista",
      descricao: "Responda 250 questões",
      icone: "medal",
      desbloqueada: respondidas >= 250,
      atual: Math.min(respondidas, 250),
      alvo: 250,
    },
    {
      id: "streak-3",
      titulo: "Constância",
      descricao: "Estude 3 dias seguidos",
      icone: "calendar-check",
      desbloqueada: streak >= 3,
      atual: Math.min(streak, 3),
      alvo: 3,
    },
    {
      id: "streak-7",
      titulo: "Disciplina de ferro",
      descricao: "Estude 7 dias seguidos",
      icone: "zap",
      desbloqueada: streak >= 7,
      atual: Math.min(streak, 7),
      alvo: 7,
    },
    {
      id: "primeiro-simulado",
      titulo: "Sob pressão",
      descricao: "Conclua seu primeiro simulado",
      icone: "timer",
      desbloqueada: simuladosFeitos >= 1,
      atual: Math.min(simuladosFeitos, 1),
      alvo: 1,
    },
    {
      id: "gabaritou",
      titulo: "Nota mil",
      descricao: "Acerte 100% em um simulado (10+ questões)",
      icone: "crown",
      desbloqueada: gabaritou,
    },
    {
      id: "pontaria",
      titulo: "Pontaria certeira",
      descricao: "80%+ de aproveitamento geral (mín. 20 questões)",
      icone: "target",
      desbloqueada: pontaria,
    },
  ];

  return {
    xp,
    nivel,
    xpNoNivel,
    xpProximoNivel,
    streak,
    respondidas,
    acertos,
    percentualGeral,
    simuladosFeitos,
    conquistas,
  };
}
