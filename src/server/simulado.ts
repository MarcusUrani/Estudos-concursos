"use server";

import { prisma } from "@/lib/prisma";
import { atualizarRevisao } from "@/server/revisao";
import { getConcursoAtualId } from "@/server/concurso";
import { requireUserId } from "@/server/usuario";

// Uma resposta do gabarito do aluno. alternativaId null = nao respondida (tempo esgotou).
export type RespostaSimulado = { questaoId: string; alternativaId: string | null };

export type AlternativaResultado = {
  id: string;
  texto: string;
  ordem: number;
  correta: boolean;
};

export type ItemResultado = {
  questaoId: string;
  enunciado: string;
  assunto: string;
  subassunto: string | null;
  nivel: string;
  banca: string;
  alternativas: AlternativaResultado[];
  escolhidaId: string | null;
  acertou: boolean;
  explicacao: string;
  fonteLegal: string | null;
};

export type ResultadoSimulado = {
  simuladoId: string;
  total: number;
  acertos: number;
  tempo: number; // segundos gastos
  duracao: number; // limite escolhido (segundos)
  percentual: number;
  porAssunto: { assunto: string; total: number; acertos: number; percentual: number }[];
  itens: ItemResultado[];
};

/**
 * Corrige um simulado no servidor (fonte autoritativa do gabarito), grava as
 * respostas individuais (alimentando stats/historico/revisao), registra o
 * resumo em Simulado e devolve o resultado detalhado para revisao.
 */
export async function finalizarSimulado(
  respostas: RespostaSimulado[],
  tempoGasto: number,
  duracao: number
): Promise<ResultadoSimulado> {
  const userId = await requireUserId();

  const ids = respostas.map((r) => r.questaoId);
  const questoes = await prisma.questao.findMany({
    where: { id: { in: ids } },
    include: {
      assunto: true,
      subassunto: true,
      alternativas: { orderBy: { ordem: "asc" } },
    },
  });
  const porId = new Map(questoes.map((q) => [q.id, q]));

  const respondidas = respostas.filter((r) => r.alternativaId);
  // Distribui o tempo total entre as questoes respondidas (aproximacao para
  // manter o "tempo estudando" do dashboard coerente).
  const tempoPorQuestao = respondidas.length
    ? Math.round(Math.max(0, tempoGasto) / respondidas.length)
    : 0;

  const itens: ItemResultado[] = [];
  let acertos = 0;

  // Ordem das questoes = ordem em que foram apresentadas.
  for (const r of respostas) {
    const q = porId.get(r.questaoId);
    if (!q) continue;

    const escolhida = r.alternativaId
      ? q.alternativas.find((a) => a.id === r.alternativaId) ?? null
      : null;
    const acertou = !!escolhida?.correta;
    if (acertou) acertos++;

    // So grava Resposta quando o aluno realmente marcou uma alternativa.
    if (escolhida) {
      await prisma.resposta.create({
        data: {
          userId,
          questaoId: q.id,
          alternativaId: escolhida.id,
          acertou,
          tempo: Math.min(tempoPorQuestao, 3600),
        },
      });
      await atualizarRevisao(userId, q.id, acertou);
    }

    itens.push({
      questaoId: q.id,
      enunciado: q.enunciado,
      assunto: q.assunto.nome,
      subassunto: q.subassunto?.nome ?? null,
      nivel: q.nivel,
      banca: q.banca,
      explicacao: q.explicacao,
      fonteLegal: q.fonteLegal,
      escolhidaId: escolhida?.id ?? null,
      acertou,
      alternativas: q.alternativas.map((a) => ({
        id: a.id,
        texto: a.texto,
        ordem: a.ordem,
        correta: a.correta,
      })),
    });
  }

  const total = itens.length;

  const simulado = await prisma.simulado.create({
    data: {
      userId,
      total,
      acertos,
      tempo: Math.max(0, Math.min(tempoGasto, duracao)),
      duracao,
      concursoId: await getConcursoAtualId(),
    },
  });

  // Desempenho por tema dentro deste simulado.
  const mapa = new Map<string, { total: number; acertos: number }>();
  for (const i of itens) {
    const cur = mapa.get(i.assunto) ?? { total: 0, acertos: 0 };
    cur.total++;
    if (i.acertou) cur.acertos++;
    mapa.set(i.assunto, cur);
  }
  const porAssunto = Array.from(mapa.entries())
    .map(([assunto, v]) => ({
      assunto,
      total: v.total,
      acertos: v.acertos,
      percentual: Math.round((v.acertos / v.total) * 100),
    }))
    .sort((a, b) => b.percentual - a.percentual);

  return {
    simuladoId: simulado.id,
    total,
    acertos,
    tempo: simulado.tempo,
    duracao,
    percentual: total ? Math.round((acertos / total) * 100) : 0,
    porAssunto,
    itens,
  };
}

export type SimuladoResumo = {
  id: string;
  total: number;
  acertos: number;
  percentual: number;
  tempo: number;
  duracao: number;
  finalizadoEm: string;
};

/** Historico de simulados do usuario, do mais recente para o mais antigo. */
export async function listarSimulados(): Promise<SimuladoResumo[]> {
  const userId = await requireUserId();
  const simulados = await prisma.simulado.findMany({
    where: { userId, concursoId: await getConcursoAtualId() },
    orderBy: { finalizadoEm: "desc" },
    take: 50,
  });
  return simulados.map((s) => ({
    id: s.id,
    total: s.total,
    acertos: s.acertos,
    percentual: s.total ? Math.round((s.acertos / s.total) * 100) : 0,
    tempo: s.tempo,
    duracao: s.duracao,
    finalizadoEm: s.finalizadoEm.toISOString(),
  }));
}
