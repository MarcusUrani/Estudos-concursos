import Link from "next/link";
import { auth } from "@/auth";
import { podeAcessarRevisao } from "@/lib/acesso";
import { getDashboardStats, type DashboardStats } from "@/server/stats";
import { getGamificacao } from "@/server/gamificacao";
import { listarSessoesEmAndamento } from "@/server/sessao";
import { formatDuracao, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Bolha } from "@/components/ui/bolha";
import { Pagina, Cabecalho } from "@/components/ui/pagina";
import {
  CheckCircle2,
  AlertTriangle,
  BellRing,
  ArrowRight,
  Flame,
  Sparkles,
  Dumbbell,
  TimerReset,
  Layers,
  Play,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Metadados de cada modo retomavel.
const MODOS: Record<
  string,
  { label: string; href: string; icon: React.ElementType; unidade: string }
> = {
  treino: { label: "Treino", href: "/treino?retomar=1", icon: Dumbbell, unidade: "questões" },
  simulado: {
    label: "Simulado",
    href: "/simulado?retomar=1",
    icon: TimerReset,
    unidade: "questões",
  },
  flashcards: {
    label: "Flashcards",
    href: "/flashcards?retomar=1",
    icon: Layers,
    unidade: "cards",
  },
};

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

/** Indicador da faixa do herói. O numero e o conteudo — vai grande e em mono,
 *  com a etiqueta embaixo. Sem icone e sem cor de fundo: sao quatro numeros
 *  lado a lado, e qualquer enfeite aqui vira ruido multiplicado por quatro. */
function Indicador({
  label,
  valor,
  sufixo,
  className,
}: {
  label: string;
  valor: string;
  sufixo?: string;
  className?: string;
}) {
  return (
    // `min-w-0` pelo mesmo motivo das colunas: a etiqueta em caixa alta com
    // tracking aberto ("REVISÕES PENDENTES") tem min-content largo e, sem isso,
    // empurra a celula da grade para alem da tela.
    <div className={cn("min-w-0 px-5 py-4", className)}>
      <p className="tabular text-2xl font-semibold text-slate-100 sm:text-3xl">
        {valor}
        {sufixo && <span className="ml-0.5 text-lg text-slate-400">{sufixo}</span>}
      </p>
      <p className="etiqueta mt-1.5">{label}</p>
    </div>
  );
}

/** Ritmo: uma barra por dia, altura = questoes respondidas. Uma variavel so.
 *  O dia sem barra e o dado mais importante do gráfico — por isso a regua de
 *  base atravessa todos os dias, inclusive os vazios. */
function Ritmo({ dias }: { dias: DashboardStats["porDia"] }) {
  const teto = Math.max(1, ...dias.map((d) => d.total));
  return (
    <div>
      <div className="flex items-end gap-1.5 border-b border-slate-700">
        {dias.map((d) => (
          <div key={d.dia} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="flex h-24 w-full items-end"
              title={`${d.total} ${d.total === 1 ? "questão" : "questões"} · ${d.acertos} ${
                d.acertos === 1 ? "acerto" : "acertos"
              }`}
            >
              <div
                className={cn("w-full", d.total ? "bg-indigo-500" : "bg-transparent")}
                style={{ height: `${(d.total / teto) * 100}%` }}
              />
            </div>
            <span className="tabular hidden text-[0.625rem] leading-none text-slate-500 sm:block">
              {d.rotulo}
            </span>
          </div>
        ))}
      </div>

      {/* No celular os 14 numeros nao cabem — cada rotulo fica mais largo que a
          propria coluna e eles se sobrepoem. Sobram as duas pontas, que e o que
          de fato situa a faixa no tempo. */}
      <div className="mt-2 flex justify-between text-[0.625rem] text-slate-500 sm:hidden">
        <span className="tabular">dia {dias[0]?.rotulo}</span>
        <span>hoje</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [session, s, g, sessoes] = await Promise.all([
    auth(),
    getDashboardStats(),
    getGamificacao(),
    listarSessoesEmAndamento(),
  ]);
  const podeRevisar = podeAcessarRevisao(session?.user?.email);
  const pctNivel = Math.round((g.xpNoNivel / g.xpProximoNivel) * 100);
  const emAndamento = sessoes.filter((x) => MODOS[x.tipo] && x.indice < x.total);
  const acertosNaFita = s.ultimas.filter(Boolean).length;

  // Este bloco aparece em dois lugares do layout, mas nunca nos dois ao mesmo
  // tempo — cada ponto de montagem se esconde no breakpoint do outro. Fica numa
  // variavel para que a marcacao exista uma vez so.
  const blocoContinuar = emAndamento.length > 0 && (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Play className="h-4 w-4 text-indigo-400" />
          Continuar de onde parou
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {emAndamento.map((x) => {
          const m = MODOS[x.tipo];
          const pct = x.total ? Math.round((x.indice / x.total) * 100) : 0;
          return (
            <Link key={x.tipo} href={m.href} className="group block">
              <div className="rounded-sm border border-slate-800 bg-slate-950/40 p-4 transition-colors group-hover:border-indigo-600/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-indigo-500/15 text-indigo-300">
                    <m.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100">{m.label}</p>
                    <p className="tabular text-xs text-slate-400">
                      {x.indice} de {x.total} {m.unidade} · {pct}%
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-indigo-300 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-3">
                  <Progress value={pct} barClassName="bg-indigo-500" />
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <Pagina>
      <Cabecalho etiqueta={fmtData.format(new Date())} titulo={`Olá, ${s.nome}`}>
        <Link href="/treino">
          <Button size="lg">
            Continuar estudando
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Cabecalho>

      {podeRevisar && s.revisoesPendentes > 0 && (
        <Link href="/revisao" className="block">
          <Card className="border-amber-700/40 bg-amber-500/5 transition-colors hover:border-amber-600/60">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-amber-500/15 text-amber-300">
                <BellRing className="h-5 w-5" />
              </div>
              <div className="min-w-60 flex-1">
                <p className="text-sm font-semibold text-slate-100">
                  Você tem {s.revisoesPendentes}{" "}
                  {s.revisoesPendentes === 1 ? "revisão vencida" : "revisões vencidas"}
                </p>
                <p className="text-xs text-slate-400">
                  Revise agora pela fila espaçada para fixar o conteúdo no momento certo.
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-amber-300">
                Revisar <ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* `min-w-0` nas colunas nao e detalhe: item de grade tem `min-width:auto`
          por padrao e se recusa a encolher abaixo do conteudo. Sem isso a
          coluna estoura a tela no celular, a pagina ganha rolagem horizontal e
          o cabecalho fixo — com o botao do menu — sai do campo visivel. */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* ===================== Coluna principal ===================== */}
        <div className="min-w-0 space-y-6 xl:col-span-8">
          {/* No celular tudo vira uma coluna só, e o trilho cai para o fim da
              página. Retomar uma sessão pela metade é a ação mais provável de
              quem abre o app, então ela sobe para o topo — antes até do
              cartão-resposta, que é leitura, não ação. */}
          {blocoContinuar && <div className="xl:hidden">{blocoContinuar}</div>}

          {/* HERÓI — o cartão-resposta. Nenhuma outra tela mostra a SEQUÊNCIA
              das respostas: a média diz onde ela está, a fita diz para onde
              ela está indo. É também o símbolo da marca em tamanho grande. */}
          <Card>
            <CardHeader className="flex flex-wrap items-baseline justify-between gap-2">
              <CardTitle className="text-base">Seu cartão-resposta</CardTitle>
              <p className="etiqueta">
                {s.ultimas.length
                  ? `Últimas ${s.ultimas.length} · ${acertosNaFita} acertos`
                  : "Sem respostas ainda"}
              </p>
            </CardHeader>

            <CardContent className="px-5 py-5">
              {s.ultimas.length ? (
                <div
                  className="flex flex-wrap gap-1.5"
                  role="img"
                  aria-label={`Últimas ${s.ultimas.length} respostas: ${acertosNaFita} acertos e ${s.ultimas.length - acertosNaFita} erros.`}
                >
                  {s.ultimas.map((acertou, i) => (
                    <Bolha key={i} tamanho="md" estado={acertou ? "certa" : "errada"} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Resolva sua primeira questão e ela aparece aqui. Cada bolha é uma
                  resposta, na ordem em que você respondeu.
                </p>
              )}
            </CardContent>

            {/* A régua separa o dado agregado da sequência acima. Os quatro
                números dividem a largura em partes iguais, como as colunas de
                um cabeçalho de prova. */}
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-800 border-t border-slate-800 sm:grid-cols-4 sm:divide-y-0">
              <Indicador label="Respondidas" valor={String(s.respondidas)} />
              <Indicador label="Acertos" valor={String(s.percentualAcerto)} sufixo="%" />
              <Indicador label="Tempo estudando" valor={formatDuracao(s.tempoEstudoSegundos)} />
              <Indicador
                label={podeRevisar ? "Revisões pendentes" : "Sequência"}
                valor={podeRevisar ? String(s.revisoesPendentes) : String(g.streak)}
                sufixo={podeRevisar ? undefined : g.streak === 1 ? " dia" : " dias"}
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ritmo dos últimos 14 dias</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <Ritmo dias={s.porDia} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desempenho por tema</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              {s.porAssunto.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Você ainda não respondeu questões. Comece um treino para ver suas
                  estatísticas aparecerem aqui.
                </p>
              ) : (
                // Em tela larga a lista quebra em duas colunas: é o uso mais
                // honesto da largura — o dobro de temas visível sem rolar.
                <div className="grid gap-x-10 gap-y-4 2xl:grid-cols-2">
                  {s.porAssunto.map((a) => (
                    <div key={a.assunto} className="min-w-0">
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-slate-300">{a.assunto}</span>
                        <span className="tabular shrink-0 font-medium text-slate-400">
                          {a.percentual}%{" "}
                          <span className="text-slate-500">
                            ({a.acertos}/{a.total})
                          </span>
                        </span>
                      </div>
                      <Progress
                        value={a.percentual}
                        barClassName={
                          a.percentual >= 80
                            ? "bg-emerald-500"
                            : a.percentual >= 60
                              ? "bg-indigo-500"
                              : "bg-rose-500"
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===================== Trilho de contexto ===================== */}
        <div className="min-w-0 space-y-6 xl:col-span-4">
          {/* No desktop a sessão em andamento fica aqui, no trilho: a coluna da
              direita já está inteira no campo de visão, sem rolagem. */}
          {blocoContinuar && <div className="hidden xl:block">{blocoContinuar}</div>}

          <Link href="/conquistas" className="block">
            <Card className="transition-colors hover:border-slate-700">
              <CardHeader className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Nível {g.nivel}</CardTitle>
                <span className="flex items-center gap-1 text-sm text-indigo-300">
                  <Sparkles className="h-4 w-4" />
                  Conquistas
                </span>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-5">
                <div className="flex items-center gap-4">
                  <div className="tabular flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-indigo-500/15 text-lg font-bold text-indigo-300">
                    {g.nivel}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <p className="etiqueta">Experiência</p>
                      <p className="tabular text-xs text-slate-500">
                        {g.xpNoNivel}/{g.xpProximoNivel} XP
                      </p>
                    </div>
                    <Progress value={pctNivel} barClassName="bg-indigo-500" />
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium",
                    g.streak > 0
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                  <Flame className="h-4 w-4" />
                  <span className="tabular">{g.streak}</span>
                  {g.streak === 1 ? "dia seguido" : "dias seguidos"}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Temas dominados
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {s.temasFortes.length ? (
                s.temasFortes.map((t) => (
                  <Badge key={t} variant="success">
                    {t}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">Resolva mais questões para identificar.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Temas a reforçar
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {s.temasFracos.length ? (
                s.temasFracos.map((t) => (
                  <Badge key={t} variant="warning">
                    {t}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">Nenhum tema crítico por enquanto.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Pagina>
  );
}
