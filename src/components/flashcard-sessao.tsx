"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { avaliarFlashcard, type FlashcardDTO } from "@/server/flashcards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BotaoReporte } from "@/components/botao-reporte";
import {
  RotateCcw,
  Eye,
  Check,
  X,
  ScrollText,
  BookOpen,
  Layers,
  ArrowRight,
} from "lucide-react";

/** Sessao de flashcards: vira o card e a auto-avaliacao reagenda a revisao. */
export function FlashcardSessao({
  cards,
  onSair,
}: {
  cards: FlashcardDTO[];
  onSair: () => void;
}) {
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [sabia, setSabia] = useState(0);
  const [fim, setFim] = useState(false);
  const [pending, startTransition] = useTransition();

  function avaliar(acertou: boolean) {
    const card = cards[indice];
    if (acertou) setSabia((n) => n + 1);
    startTransition(async () => {
      await avaliarFlashcard(card.questaoId, acertou);
    });
    if (indice + 1 >= cards.length) setFim(true);
    else {
      setIndice((i) => i + 1);
      setRevelado(false);
    }
  }

  if (fim) {
    const pct = cards.length ? Math.round((sabia / cards.length) * 100) : 0;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Layers className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Baralho concluído!</h2>
            <p className="mt-1 text-slate-400">
              Você marcou{" "}
              <span className="font-semibold text-emerald-400">
                {sabia} de {cards.length}
              </span>{" "}
              como sabidos ({pct}%). As demais voltam mais cedo na revisão.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Progress value={pct} barClassName={pct >= 80 ? "bg-emerald-500" : "bg-indigo-500"} />
          </div>
          <Button onClick={onSair} className="mt-2">
            Escolher outro baralho
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const card = cards[indice];
  return (
    <div>
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
          <span>
            Card {indice + 1} de {cards.length}
          </span>
          <span>{Math.round((indice / cards.length) * 100)}%</span>
        </div>
        <Progress value={(indice / cards.length) * 100} />
      </div>

      <Card className="min-h-72">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{card.assunto}</Badge>
              {card.subassunto && <Badge variant="neutral">{card.subassunto}</Badge>}
            </div>
            <BotaoReporte questaoId={card.questaoId} />
          </div>

          <p className="text-base leading-relaxed text-slate-100">{card.frente}</p>

          <AnimatePresence initial={false}>
            {revelado && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 overflow-hidden"
              >
                <div className="rounded-xl border border-emerald-700/40 bg-emerald-500/10 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    Resposta
                  </p>
                  <p className="text-sm leading-relaxed text-emerald-50">{card.verso}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                    <BookOpen className="h-4 w-4" /> Comentário
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">{card.explicacao}</p>
                  {card.fonteLegal && (
                    <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                      <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <span>
                        <span className="font-medium text-slate-300">Base legal: </span>
                        {card.fonteLegal}
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="mt-4">
        {!revelado ? (
          <Button size="lg" className="w-full" onClick={() => setRevelado(true)}>
            <Eye className="h-4 w-4" />
            Mostrar resposta
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => avaliar(false)}
              disabled={pending}
              className="border-rose-700/50 text-rose-200 hover:bg-rose-500/10"
            >
              <X className="h-4 w-4" />
              Não sabia
            </Button>
            <Button
              size="lg"
              onClick={() => avaliar(true)}
              disabled={pending}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <Check className="h-4 w-4" />
              Sabia
            </Button>
          </div>
        )}
        <button
          onClick={onSair}
          className="mt-3 flex w-full items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Trocar baralho
        </button>
      </div>
    </div>
  );
}
