"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { QuestaoDTO } from "@/server/treino";
import type { RespostaSimulado } from "@/server/simulado";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
} from "lucide-react";

function formatRelogio(segundos: number) {
  const s = Math.max(0, segundos);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(seg)}` : `${pad(m)}:${pad(seg)}`;
}

export function SimuladoSessao({
  questoes,
  duracaoSegundos,
  onFinalizar,
  pending,
}: {
  questoes: QuestaoDTO[];
  duracaoSegundos: number;
  onFinalizar: (respostas: RespostaSimulado[], tempoGasto: number) => void;
  pending?: boolean;
}) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [restante, setRestante] = useState(duracaoSegundos);
  const [confirmando, setConfirmando] = useState(false);
  const finalizadoRef = useRef(false);

  const finalizar = useCallback(() => {
    if (finalizadoRef.current) return;
    finalizadoRef.current = true;
    const lista: RespostaSimulado[] = questoes.map((q) => ({
      questaoId: q.id,
      alternativaId: respostas[q.id] ?? null,
    }));
    onFinalizar(lista, duracaoSegundos - restante);
  }, [questoes, respostas, duracaoSegundos, restante, onFinalizar]);

  // Relogio regressivo — finaliza automaticamente ao zerar.
  useEffect(() => {
    const id = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restante === 0) finalizar();
  }, [restante, finalizar]);

  const atual = questoes[indice];
  const respondidas = Object.keys(respostas).length;
  const tempoCritico = restante <= 60;

  function escolher(altId: string) {
    setRespostas((cur) => ({ ...cur, [atual.id]: altId }));
  }

  return (
    <div className="space-y-4">
      {/* Barra fixa: relogio + progresso + finalizar */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div
          className={cn(
            "flex items-center gap-2 text-lg font-bold tabular-nums",
            tempoCritico ? "text-rose-400" : "text-slate-100"
          )}
        >
          <Clock className={cn("h-5 w-5", tempoCritico && "animate-pulse")} />
          {formatRelogio(restante)}
        </div>
        <span className="text-sm text-slate-400">
          {respondidas} de {questoes.length} respondidas
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirmando(true)}
          disabled={pending}
        >
          <Flag className="h-4 w-4" />
          Finalizar
        </Button>
      </div>

      {/* Mapa de questoes */}
      <div className="flex flex-wrap gap-1.5">
        {questoes.map((q, i) => {
          const respondida = !!respostas[q.id];
          const ativa = i === indice;
          return (
            <button
              key={q.id}
              onClick={() => setIndice(i)}
              className={cn(
                "h-8 w-8 rounded-lg border text-xs font-semibold transition-all",
                ativa
                  ? "border-indigo-400 bg-indigo-500 text-white"
                  : respondida
                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
                  : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <motion.div
        key={atual.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-400">
                Questão {indice + 1} de {questoes.length}
              </span>
              <Badge>{atual.assunto}</Badge>
              {atual.subassunto && <Badge variant="neutral">{atual.subassunto}</Badge>}
              <Badge
                variant={
                  atual.nivel === "Dificil"
                    ? "danger"
                    : atual.nivel === "Facil"
                    ? "success"
                    : "warning"
                }
              >
                {atual.nivel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed text-slate-100">{atual.enunciado}</p>

            <div className="space-y-2">
              {atual.alternativas.map((alt, i) => {
                const escolhida = respostas[atual.id] === alt.id;
                return (
                  <button
                    key={alt.id}
                    onClick={() => escolher(alt.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                      escolhida
                        ? "border-indigo-500 bg-indigo-500/10 text-slate-100"
                        : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                        escolhida ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 pt-0.5">{alt.texto}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIndice((i) => Math.max(0, i - 1))}
                disabled={indice === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {indice + 1 < questoes.length ? (
                <Button onClick={() => setIndice((i) => Math.min(questoes.length - 1, i + 1))}>
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setConfirmando(true)} disabled={pending}>
                  <Flag className="h-4 w-4" />
                  Finalizar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmacao de finalizacao */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="space-y-4 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Finalizar simulado?</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {questoes.length - respondidas > 0
                    ? `Você deixou ${questoes.length - respondidas} questão(ões) sem resposta. Elas contarão como erro.`
                    : "Você respondeu todas as questões. Bom trabalho!"}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" onClick={() => setConfirmando(false)} disabled={pending}>
                  Continuar
                </Button>
                <Button onClick={finalizar} disabled={pending}>
                  {pending ? "Corrigindo..." : "Finalizar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
