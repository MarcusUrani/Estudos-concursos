"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { avaliarFlashcard, type FlashcardDTO } from "@/server/flashcards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PaginaLeitura, TrilhoBloco } from "@/components/ui/pagina";
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
  indiceInicial = 0,
  sabiaIniciais = 0,
  onProgresso,
  onConcluir,
}: {
  cards: FlashcardDTO[];
  onSair: () => void;
  indiceInicial?: number;
  sabiaIniciais?: number;
  onProgresso?: (indice: number, sabia: number) => void;
  onConcluir?: () => void;
}) {
  const [indice, setIndice] = useState(indiceInicial);
  const [revelado, setRevelado] = useState(false);
  const [sabia, setSabia] = useState(sabiaIniciais);
  const [fim, setFim] = useState(false);
  const [pending, startTransition] = useTransition();

  function avaliar(acertou: boolean) {
    const card = cards[indice];
    const novoSabia = acertou ? sabia + 1 : sabia;
    if (acertou) setSabia(novoSabia);
    startTransition(async () => {
      await avaliarFlashcard(card.questaoId, acertou);
    });
    const novoIndice = indice + 1;
    if (novoIndice >= cards.length) {
      setFim(true);
      onConcluir?.();
    } else {
      setIndice(novoIndice);
      setRevelado(false);
      onProgresso?.(novoIndice, novoSabia);
    }
  }

  if (fim) {
    const pct = cards.length ? Math.round((sabia / cards.length) * 100) : 0;
    return (
      <PaginaLeitura>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-indigo-500/15 text-indigo-300">
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
      </PaginaLeitura>
    );
  }

  const card = cards[indice];
  const pctSessao = Math.round((indice / cards.length) * 100);

  const trilho = (
    <>
      <TrilhoBloco>
        <p className="etiqueta">Card</p>
        <p className="tabular mt-1.5 text-3xl font-semibold leading-none text-slate-100">
          {String(indice + 1).padStart(2, "0")}
          <span className="text-slate-500"> / {String(cards.length).padStart(2, "0")}</span>
        </p>
        <div className="mt-4">
          <Progress value={pctSessao} barClassName="bg-indigo-500" />
        </div>
        <p className="tabular mt-2 text-xs text-slate-500">{pctSessao}% do baralho</p>
      </TrilhoBloco>

      <TrilhoBloco titulo="Classificação">
        <div className="flex flex-wrap gap-2">
          <Badge>{card.assunto}</Badge>
          {card.subassunto && <Badge variant="neutral">{card.subassunto}</Badge>}
        </div>
        <div className="mt-4">
          <BotaoReporte questaoId={card.questaoId} />
        </div>
      </TrilhoBloco>
    </>
  );

  return (
    <PaginaLeitura trilho={trilho}>
      <Card className="min-h-72">
        <CardContent className="space-y-4 p-6">
          <p className="text-[1.0625rem] leading-[1.65] text-slate-100">{card.frente}</p>

          <AnimatePresence initial={false}>
            {revelado && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 overflow-hidden"
              >
                <div className="rounded-sm border border-emerald-700/40 bg-emerald-500/10 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    Resposta
                  </p>
                  <p className="text-sm leading-relaxed text-emerald-50">{card.verso}</p>
                </div>
                <div className="rounded-sm border border-slate-800 bg-slate-950/40 p-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                    <BookOpen className="h-4 w-4" /> Comentário
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">{card.explicacao}</p>
                  {card.fonte && (
                    <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                      <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <span>
                        <span className="font-medium text-slate-300">Fonte: </span>
                        {card.fonte}
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
    </PaginaLeitura>
  );
}
