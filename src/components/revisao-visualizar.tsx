"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { alternarFavorito } from "@/server/treino";
import type { QuestaoRevisaoDTO } from "@/server/revisao";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Star,
  CheckCircle2,
  BookOpen,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/** Modo somente-leitura: navega livremente pelas questoes com gabarito visivel. */
export function RevisaoVisualizar({
  questoes,
  favoritosIniciais,
}: {
  questoes: QuestaoRevisaoDTO[];
  favoritosIniciais: Record<string, boolean>;
}) {
  const [indice, setIndice] = useState(0);
  const [favs, setFavs] = useState<Record<string, boolean>>(favoritosIniciais);
  const [pending, startTransition] = useTransition();

  const q = questoes[indice];
  const total = questoes.length;

  function toggleFav() {
    startTransition(async () => {
      const fav = await alternarFavorito(q.id);
      setFavs((cur) => ({ ...cur, [q.id]: fav }));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Questão {indice + 1} de {total}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIndice((i) => Math.min(total - 1, i + 1))}
            disabled={indice === total - 1}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <motion.div
        key={q.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{q.assunto}</Badge>
                {q.subassunto && <Badge variant="neutral">{q.subassunto}</Badge>}
                <Badge variant="neutral">{q.banca}</Badge>
                <Badge
                  variant={
                    q.nivel === "Dificil"
                      ? "danger"
                      : q.nivel === "Facil"
                      ? "success"
                      : "warning"
                  }
                >
                  {q.nivel}
                </Badge>
              </div>
              <button
                onClick={toggleFav}
                disabled={pending}
                title="Favoritar"
                className="text-slate-400 transition-colors hover:text-amber-300"
              >
                <Star
                  className={cn("h-5 w-5", favs[q.id] && "fill-amber-400 text-amber-400")}
                />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed text-slate-100">{q.enunciado}</p>

            <div className="space-y-2">
              {q.alternativas.map((alt, i) => (
                <div
                  key={alt.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
                    alt.correta
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                      : "border-slate-800 bg-slate-950/40 text-slate-400"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                      alt.correta ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 pt-0.5">{alt.texto}</span>
                  {alt.correta && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                <BookOpen className="h-4 w-4" /> Comentário
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{q.explicacao}</p>
              {q.fonteLegal && (
                <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                  <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <span>
                    <span className="font-medium text-slate-300">Base legal: </span>
                    {q.fonteLegal}
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
