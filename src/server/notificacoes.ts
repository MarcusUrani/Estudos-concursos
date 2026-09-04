"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConcursoAtualId } from "@/server/concurso";
import { requireUserId } from "@/server/usuario";
import { ehTipoValido, MAX_CORPO, MAX_TITULO } from "@/lib/notificacoes";

/* =============================================================================
   Notificacoes do sistema

   Comunicado de mao unica: o admin escreve, quem estuda le.

   ALCANCE. Sem concurso = todo mundo. Com concurso = so quem esta estudando
   aquele. Nao existe matricula neste app — o "concurso do usuario" e o que ele
   tem selecionado no seletor, guardado em cookie, e e o mesmo criterio que todo
   o resto do conteudo usa. Consequencia que vale saber: quem troca de concurso
   passa a ver outro conjunto de avisos.

   LEITURA. A tabela guarda quem JA LEU. A ausencia de linha e o "nao lida",
   entao uma notificacao nova nasce nao lida para todo mundo sem precisar
   escrever uma linha por usuario no envio.
   ============================================================================= */

async function exigirAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Acesso restrito a administradores.");
  return session.user.id!;
}

/** Alcance de quem esta lendo: as gerais mais as do concurso atual. */
function alcanceDe(concursoId: string | null) {
  return concursoId
    ? { OR: [{ concursoId: null }, { concursoId }] }
    : { concursoId: null };
}

// ---------------------------------------------------------------- leitura

export type NotificacaoDTO = {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string;
  criadaEm: string;
  /** Nome do concurso, ou null quando o aviso e geral. */
  concurso: string | null;
  lida: boolean;
};

export async function listarNotificacoes(): Promise<NotificacaoDTO[]> {
  const userId = await requireUserId();
  const concursoId = await getConcursoAtualId();

  const notificacoes = await prisma.notificacao.findMany({
    where: alcanceDe(concursoId),
    orderBy: { criadaEm: "desc" },
    take: 50,
    include: {
      concurso: { select: { nome: true } },
      // So a leitura DESTA pessoa: a de outras nao e da conta dela.
      leituras: { where: { userId }, select: { id: true } },
    },
  });

  return notificacoes.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    corpo: n.corpo,
    criadaEm: n.criadaEm.toISOString(),
    concurso: n.concurso?.nome ?? null,
    lida: n.leituras.length > 0,
  }));
}

/**
 * Quantas nao lidas — o numero do sininho.
 *
 * Roda no layout, ou seja, em TODA navegacao. Por isso e uma contagem so, com
 * `none` em vez de trazer as linhas para comparar na aplicacao.
 */
export async function contarNaoLidas(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return 0;

  const concursoId = await getConcursoAtualId();
  return prisma.notificacao.count({
    where: { ...alcanceDe(concursoId), leituras: { none: { userId } } },
  });
}

/**
 * Marca como lidas as que a pessoa acabou de ver.
 *
 * Recebe os ids que a tela renderizou em vez de marcar "todas": marcar o que
 * nao esta na tela apagaria o aviso de algo que chegou entre a consulta e o
 * clique, e a pessoa nunca saberia que existiu.
 */
export async function marcarComoLidas(ids: string[]): Promise<void> {
  const userId = await requireUserId();
  const limpos = (ids ?? []).filter((id) => typeof id === "string" && id).slice(0, 50);
  if (limpos.length === 0) return;

  // `skipDuplicates` porque o efeito da tela pode disparar duas vezes (React em
  // modo estrito) e porque duas abas abertas fazem a mesma chamada.
  await prisma.notificacaoLida.createMany({
    data: limpos.map((notificacaoId) => ({ userId, notificacaoId })),
    skipDuplicates: true,
  });

  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- admin

export type NotificacaoAdminDTO = NotificacaoDTO & {
  autor: string | null;
  /** Quantas pessoas ja leram. */
  leituras: number;
};

export async function listarNotificacoesAdmin(): Promise<NotificacaoAdminDTO[]> {
  await exigirAdmin();

  const notificacoes = await prisma.notificacao.findMany({
    orderBy: { criadaEm: "desc" },
    take: 100,
    include: {
      concurso: { select: { nome: true } },
      autor: { select: { nome: true } },
      _count: { select: { leituras: true } },
    },
  });

  return notificacoes.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    corpo: n.corpo,
    criadaEm: n.criadaEm.toISOString(),
    concurso: n.concurso?.nome ?? null,
    autor: n.autor?.nome ?? null,
    leituras: n._count.leituras,
    // No painel do admin a marca de lida nao diz nada: ele ve o total de
    // leituras ao lado.
    lida: true,
  }));
}

/* Erro como VALOR, pelo mesmo motivo de `server/redacao.ts`: em producao o Next
   apaga a mensagem de erro lancado numa server action e devolve 500 sem
   detalhe, entao a tela nunca conseguia dizer o que estava errado. */
export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

export async function criarNotificacao(input: {
  tipo: string;
  titulo: string;
  corpo: string;
  /** Vazio ou nulo = todos os concursos. */
  concursoId?: string | null;
}): Promise<Resultado<{ id: string }>> {
  try {
    const autorId = await exigirAdmin();

    const titulo = input.titulo?.trim() ?? "";
    const corpo = input.corpo?.trim() ?? "";
    if (!ehTipoValido(input.tipo)) throw new Error("Selecione um tipo de notificação.");
    if (titulo.length < 3) throw new Error("O título é obrigatório.");
    if (titulo.length > MAX_TITULO) throw new Error(`O título passa de ${MAX_TITULO} caracteres.`);
    if (corpo.length < 3) throw new Error("O corpo da notificação é obrigatório.");
    if (corpo.length > MAX_CORPO) throw new Error(`O corpo passa de ${MAX_CORPO} caracteres.`);

    // String vazia vem do <select> quando a opcao e "todos". Vira nulo aqui,
    // que e o que o banco entende por "sem alcance restrito".
    const concursoId = input.concursoId?.trim() || null;
    if (concursoId) {
      const existe = await prisma.concurso.findUnique({
        where: { id: concursoId },
        select: { id: true },
      });
      if (!existe) throw new Error("Concurso inválido.");
    }

    const criada = await prisma.notificacao.create({
      data: { tipo: input.tipo, titulo, corpo, concursoId, autorId },
      select: { id: true },
    });

    revalidatePath("/", "layout");
    revalidatePath("/notificacoes");
    revalidatePath("/admin/notificacoes");
    return { ok: true, dados: criada };
  } catch (e) {
    console.error("[notificacoes] criarNotificacao:", e);
    return {
      ok: false,
      erro: e instanceof Error && e.message ? e.message : "Não foi possível enviar a notificação.",
    };
  }
}

export async function excluirNotificacao(id: string): Promise<Resultado<null>> {
  try {
    await exigirAdmin();
    await prisma.notificacao.delete({ where: { id } });
    revalidatePath("/", "layout");
    revalidatePath("/notificacoes");
    revalidatePath("/admin/notificacoes");
    return { ok: true, dados: null };
  } catch (e) {
    console.error("[notificacoes] excluirNotificacao:", e);
    return { ok: false, erro: "Não foi possível excluir a notificação." };
  }
}
