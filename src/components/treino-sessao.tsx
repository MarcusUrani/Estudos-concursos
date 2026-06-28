"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  responder,
  alternarFavorito,
  type QuestaoDTO,
  type ResultadoResposta,
} from "@/server/treino";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BotaoReporte } from "@/components/botao-reporte";
import { cn } from "@/lib/utils";
import {
  Star,
  CheckCircle2,
  XCircle,
  BookOpen,
  ScrollText,
  ArrowRight,
  RotateCcw,
  Trophy,
} from "lucide-react";

export type AcaoFinal = { label: string; onClick: () => void };

/** Sessao de resolucao reutilizavel: resolve a lista, corrige e mostra resultado final. */
export function TreinoSessao({
  questoes,
  acaoFinal,
  favoritosIniciais,
}: {
  questoes: QuestaoDTO[];
  acaoFinal?: AcaoFinal;
  favoritosIniciais?: Record<string, boolean>;
}) {
  const [sessao, setSessao] = useState(0);
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);

  function proxima(acertou: boolean) {
    if (acertou) setAcertos((n) => n + 1);
    if (indice + 1 >= questoes.length) setFim(true);
    else setIndice((i) => i + 1);
  }

  function refazer() {
    setIndice(0);
    setAcertos(0);
    setFim(false);
    setSessao((s) => s + 1);
  }

  if (fim) {
    const pct = questoes.length ? Math.round((acertos / questoes.length) * 100) : 0;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Concluído!</h2>
            <p className="mt-1 text-slate-400">
              Você acertou{" "}
              <span className="font-semibold text-emerald-400">
                {acertos} de {questoes.length}
              </span>{" "}
              ({pct}%).
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Progress
              value={pct}
              barClassName={pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-indigo-500" : "bg-rose-500"}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button onClick={refazer} variant="secondary">
              <RotateCcw className="h-4 w-4" />
              Refazer
            </Button>
            {acaoFinal && (
              <Button onClick={acaoFinal.onClick}>
                {acaoFinal.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const atual = questoes[indice];
  return (
    <Questao
      key={`${sessao}-${atual.id}`}
      questao={atual}
      indice={indice}
      total={questoes.length}
      favoritoInicial={favoritosIniciais?.[atual.id] ?? false}
      onProxima={proxima}
    />
  );
}

function Questao({
  questao,
  indice,
  total,
  favoritoInicial,
  onProxima,
}: {
  questao: QuestaoDTO;
  indice: number;
  total: number;
  favoritoInicial: boolean;
  onProxima: (acertou: boolean) => void;
}) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoResposta | null>(null);
  const [favorito, setFavorito] = useState(favoritoInicial);
  const [pending, startTransition] = useTransition();
  const inicio = useState(() => Date.now())[0];

  function confirmar() {
    if (!selecionada || resultado) return;
    const tempo = Math.round((Date.now() - inicio) / 1000);
    startTransition(async () => {
      const r = await responder(questao.id, selecionada, tempo);
      setResultado(r);
    });
  }

  function toggleFav() {
    startTransition(async () => {
      const fav = await alternarFavorito(questao.id);
      setFavorito(fav);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
          <span>
            Questão {indice + 1} de {total}
          </span>
          <span>{Math.round((indice / total) * 100)}%</span>
        </div>
        <Progress value={(indice / total) * 100} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{questao.assunto}</Badge>
              {questao.subassunto && <Badge variant="neutral">{questao.subassunto}</Badge>}
              <Badge variant="neutral">{questao.banca}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <BotaoReporte questaoId={questao.id} />
              <button
                onClick={toggleFav}
                disabled={pending}
                title="Favoritar"
                className="text-slate-400 transition-colors hover:text-amber-300"
              >
                <Star className={cn("h-5 w-5", favorito && "fill-amber-400 text-amber-400")} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed text-slate-100">{questao.enunciado}</p>

          <div className="space-y-2">
            {questao.alternativas.map((alt, i) => {
              const escolhida = selecionada === alt.id;
              const correta = resultado?.alternativaCorretaId === alt.id;
              const erradaEscolhida = resultado && escolhida && !correta;

              return (
                <button
                  key={alt.id}
                  disabled={!!resultado}
                  onClick={() => setSelecionada(alt.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                    !resultado &&
                      (escolhida
                        ? "border-indigo-500 bg-indigo-500/10 text-slate-100"
                        : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"),
                    resultado && correta && "border-emerald-500 bg-emerald-500/10 text-emerald-100",
                    erradaEscolhida && "border-rose-500 bg-rose-500/10 text-rose-100",
                    resultado && !correta && !erradaEscolhida && "border-slate-800 opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                      escolhida && !resultado && "bg-indigo-500 text-white",
                      !escolhida && !resultado && "bg-slate-800 text-slate-400",
                      resultado && correta && "bg-emerald-500 text-white",
                      erradaEscolhida && "bg-rose-500 text-white",
                      resultado && !correta && !erradaEscolhida && "bg-slate-800 text-slate-500"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 pt-0.5">{alt.texto}</span>
                  {resultado && correta && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {erradaEscolhida && <XCircle className="h-5 w-5 text-rose-400" />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {resultado && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 overflow-hidden"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium",
                    resultado.acertou
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-rose-500/10 text-rose-300"
                  )}
                >
                  {resultado.acertou ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Resposta correta!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" /> Resposta incorreta.
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                    <BookOpen className="h-4 w-4" /> Comentário
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">{resultado.explicacao}</p>
                  {resultado.fonteLegal && (
                    <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                      <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <span>
                        <span className="font-medium text-slate-300">Base legal: </span>
                        {resultado.fonteLegal}
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!resultado ? (
            <Button
              size="lg"
              className="w-full"
              onClick={confirmar}
              disabled={!selecionada || pending}
            >
              {pending ? "Corrigindo..." : "Confirmar resposta"}
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={() => onProxima(resultado.acertou)}>
              {indice + 1 >= total ? "Ver resultado" : "Próxima questão"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
