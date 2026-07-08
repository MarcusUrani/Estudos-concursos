import Link from "next/link";
import { auth } from "@/auth";
import { podeAcessarRevisao } from "@/lib/acesso";
import { getDashboardStats } from "@/server/stats";
import { getGamificacao } from "@/server/gamificacao";
import { listarSessoesEmAndamento } from "@/server/sessao";
import { formatDuracao, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Target,
  Clock,
  ListChecks,
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
const MODOS: Record<string, { label: string; href: string; icon: React.ElementType; unidade: string }> = {
  treino: { label: "Treino", href: "/treino?retomar=1", icon: Dumbbell, unidade: "questões" },
  simulado: { label: "Simulado", href: "/simulado?retomar=1", icon: TimerReset, unidade: "questões" },
  flashcards: { label: "Flashcards", href: "/flashcards?retomar=1", icon: Layers, unidade: "cards" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
      </CardContent>
    </Card>
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Olá, {s.nome} <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm text-slate-400">Bom te ver de novo. Vamos resolver questões?</p>
        </div>
        <Link href="/treino">
          <Button size="lg">
            Continuar estudando
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      {podeRevisar && s.revisoesPendentes > 0 && (
        <Link href="/revisao" className="block">
          <Card className="border-amber-700/40 bg-amber-500/5 transition-colors hover:border-amber-600/60">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <BellRing className="h-5 w-5" />
              </div>
              <div className="flex-1">
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

      {emAndamento.length > 0 && (
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
                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition-colors group-hover:border-indigo-600/50">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-45 flex-1">
                      <p className="text-sm font-semibold text-slate-100">{m.label}</p>
                      <p className="text-xs text-slate-400">
                        {x.indice} de {x.total} {m.unidade} · {pct}%
                      </p>
                      <div className="mt-1.5">
                        <Progress value={pct} barClassName="bg-indigo-500" />
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-indigo-300">
                      Continuar <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Nível + sequência (gamificação) */}
      <Link href="/conquistas" className="block">
        <Card className="transition-colors hover:border-slate-700">
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-lg font-bold text-indigo-300">
              {g.nivel}
            </div>
            <div className="min-w-45 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">Nível {g.nivel}</p>
                <p className="text-xs text-slate-500">
                  {g.xpNoNivel}/{g.xpProximoNivel} XP
                </p>
              </div>
              <Progress value={pctNivel} barClassName="bg-indigo-500" />
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                g.streak > 0 ? "bg-amber-500/10 text-amber-300" : "bg-slate-800 text-slate-400"
              )}
            >
              <Flame className="h-4 w-4" />
              {g.streak} {g.streak === 1 ? "dia" : "dias"}
            </div>
            <span className="flex items-center gap-1 text-sm text-indigo-300">
              <Sparkles className="h-4 w-4" />
              Conquistas
            </span>
          </CardContent>
        </Card>
      </Link>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Questões respondidas"
          value={String(s.respondidas)}
          accent="bg-indigo-500/15 text-indigo-300"
        />
        <StatCard
          icon={Target}
          label="Acertos"
          value={`${s.percentualAcerto}%`}
          accent="bg-emerald-500/15 text-emerald-300"
        />
        <StatCard
          icon={Clock}
          label="Tempo estudando"
          value={formatDuracao(s.tempoEstudoSegundos)}
          accent="bg-violet-500/15 text-violet-300"
        />
        {podeRevisar && (
          <Link href="/revisao" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              icon={BellRing}
              label="Revisões pendentes"
              value={String(s.revisoesPendentes)}
              accent="bg-amber-500/15 text-amber-300"
            />
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Desempenho por tema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.porAssunto.length === 0 ? (
              <p className="text-sm text-slate-400">
                Você ainda não respondeu questões. Comece um treino para ver suas estatísticas
                aparecerem aqui.
              </p>
            ) : (
              s.porAssunto.map((a) => (
                <div key={a.assunto}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{a.assunto}</span>
                    <span className="font-medium text-slate-400">
                      {a.percentual}%{" "}
                      <span className="text-slate-600">
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
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
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
                <p className="text-sm text-slate-500">Resolva mais questões para identificar.</p>
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
                <p className="text-sm text-slate-500">Nenhum tema crítico por enquanto. 🎉</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
