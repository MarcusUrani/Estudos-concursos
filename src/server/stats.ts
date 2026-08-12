import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";

export type DashboardStats = {
  nome: string;
  respondidas: number;
  acertos: number;
  percentualAcerto: number;
  tempoEstudoSegundos: number;
  porAssunto: { assunto: string; total: number; acertos: number; percentual: number }[];
  temasFortes: string[];
  temasFracos: string[];
  revisoesPendentes: number;
  /** Acerto/erro das ultimas respostas, em ordem cronologica. Alimenta a fita
   *  de gabarito do dashboard. */
  ultimas: boolean[];
  /** Ritmo dos ultimos 14 dias, do mais antigo para hoje. Dias sem resposta
   *  vem com total 0 — a lacuna e o dado. */
  porDia: { dia: string; rotulo: string; total: number; acertos: number }[];
};

/** Quantas respostas a fita de gabarito mostra. */
const JANELA_FITA = 40;
/** Quantos dias a faixa de ritmo cobre. */
const JANELA_DIAS = 14;

/** Chave de dia no fuso do servidor. Mesma convencao ja usada no historico. */
function chaveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = session.user.id;
  const concursoId = await getConcursoAtualId();

  const [user, respostas, revisoesPendentes] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.resposta.findMany({
      where: { userId, questao: { concursoId } },
      include: { questao: { include: { assunto: true } } },
      orderBy: { respondidaEm: "asc" },
    }),
    prisma.revisao.count({
      where: { userId, proximaData: { lte: new Date() }, questao: { concursoId } },
    }),
  ]);

  const respondidas = respostas.length;
  const acertos = respostas.filter((r) => r.acertou).length;
  const tempoEstudoSegundos = respostas.reduce((acc, r) => acc + r.tempo, 0);
  const percentualAcerto = respondidas ? Math.round((acertos / respondidas) * 100) : 0;

  // Agrupa por assunto
  const mapa = new Map<string, { total: number; acertos: number }>();
  for (const r of respostas) {
    const nome = r.questao.assunto.nome;
    const cur = mapa.get(nome) ?? { total: 0, acertos: 0 };
    cur.total += 1;
    if (r.acertou) cur.acertos += 1;
    mapa.set(nome, cur);
  }

  const porAssunto = Array.from(mapa.entries())
    .map(([assunto, v]) => ({
      assunto,
      total: v.total,
      acertos: v.acertos,
      percentual: Math.round((v.acertos / v.total) * 100),
    }))
    .sort((a, b) => b.percentual - a.percentual);

  const comAmostra = porAssunto.filter((a) => a.total >= 2);
  const temasFortes = comAmostra.filter((a) => a.percentual >= 80).map((a) => a.assunto);
  const temasFracos = comAmostra
    .filter((a) => a.percentual < 60)
    .map((a) => a.assunto);

  // Fita de gabarito: as ultimas respostas na ordem em que aconteceram. E o
  // unico lugar do app que mostra a sequencia, e nao a media — a media esconde
  // se a pessoa esta melhorando ou piorando agora.
  const ultimas = respostas.slice(-JANELA_FITA).map((r) => r.acertou);

  // Ritmo por dia. Agregado em memoria: as respostas ja estao todas carregadas.
  const diario = new Map<string, { total: number; acertos: number }>();
  for (const r of respostas) {
    const k = chaveDia(new Date(r.respondidaEm));
    const cur = diario.get(k) ?? { total: 0, acertos: 0 };
    cur.total += 1;
    if (r.acertou) cur.acertos += 1;
    diario.set(k, cur);
  }
  const porDia = Array.from({ length: JANELA_DIAS }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (JANELA_DIAS - 1 - i));
    const k = chaveDia(d);
    const v = diario.get(k) ?? { total: 0, acertos: 0 };
    return { dia: k, rotulo: String(d.getDate()).padStart(2, "0"), ...v };
  });

  return {
    nome: user?.nome ?? "Estudante",
    respondidas,
    acertos,
    percentualAcerto,
    tempoEstudoSegundos,
    porAssunto,
    temasFortes,
    temasFracos,
    revisoesPendentes,
    ultimas,
    porDia,
  };
}
