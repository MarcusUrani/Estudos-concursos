import { getGamificacao } from "@/server/gamificacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Flame,
  Footprints,
  Medal,
  CalendarCheck,
  Zap,
  Timer,
  Crown,
  Target,
  Trophy,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ICONES: Record<string, React.ElementType> = {
  footprints: Footprints,
  flame: Flame,
  medal: Medal,
  "calendar-check": CalendarCheck,
  zap: Zap,
  timer: Timer,
  crown: Crown,
  target: Target,
};

export default async function ConquistasPage() {
  const g = await getGamificacao();
  const desbloqueadas = g.conquistas.filter((c) => c.desbloqueada).length;
  const pctNivel = Math.round((g.xpNoNivel / g.xpProximoNivel) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
          <Sparkles className="h-6 w-6 text-amber-400" />
          Conquistas
        </h1>
        <p className="text-sm text-slate-400">
          Ganhe XP resolvendo questões e simulados, e mantenha sua sequência de estudos.
        </p>
      </header>

      {/* Nivel + XP + streak */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-xl font-bold text-indigo-300">
              {g.nivel}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-sm font-semibold text-slate-100">Nível {g.nivel}</p>
                <p className="text-xs text-slate-500">
                  {g.xpNoNivel}/{g.xpProximoNivel} XP
                </p>
              </div>
              <Progress value={pctNivel} barClassName="bg-indigo-500" />
              <p className="mt-1 text-xs text-slate-500">{g.xp} XP no total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                g.streak > 0 ? "bg-amber-500/15 text-amber-300" : "bg-slate-800 text-slate-500"
              )}
            >
              <Flame className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{g.streak}</p>
              <p className="text-xs text-slate-400">
                {g.streak === 1 ? "dia seguido" : "dias seguidos"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-400" />
            Medalhas
            <span className="text-sm font-normal text-slate-500">
              {desbloqueadas}/{g.conquistas.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {g.conquistas.map((c) => {
            const Icon = ICONES[c.icone] ?? Trophy;
            const temMeta = c.alvo != null && c.atual != null;
            const pct = temMeta ? Math.round((c.atual! / c.alvo!) * 100) : 0;
            return (
              <div
                key={c.id}
                className={cn(
                  "flex gap-3 rounded-xl border p-4 transition-colors",
                  c.desbloqueada
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-slate-800 bg-slate-950/40"
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    c.desbloqueada
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-slate-800 text-slate-600"
                  )}
                >
                  {c.desbloqueada ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      c.desbloqueada ? "text-slate-100" : "text-slate-400"
                    )}
                  >
                    {c.titulo}
                  </p>
                  <p className="text-xs text-slate-500">{c.descricao}</p>
                  {temMeta && !c.desbloqueada && (
                    <div className="mt-2">
                      <Progress value={pct} barClassName="bg-slate-600" />
                      <p className="mt-1 text-[11px] text-slate-600">
                        {c.atual}/{c.alvo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
