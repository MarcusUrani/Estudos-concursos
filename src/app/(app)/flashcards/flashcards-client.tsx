"use client";

import { useState, useTransition } from "react";
import { gerarFlashcards, type FlashcardDTO } from "@/server/flashcards";
import { FlashcardSessao } from "@/components/flashcard-sessao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Layers, AlertCircle } from "lucide-react";

type Assunto = { id: string; nome: string; total: number };

export function FlashcardsClient({
  assuntos,
  assuntoInicial,
}: {
  assuntos: Assunto[];
  assuntoInicial: string;
}) {
  const [assuntoId, setAssuntoId] = useState(assuntoInicial);
  const [vencidos, setVencidos] = useState(false);
  const [quantidade, setQuantidade] = useState(20);
  const [deck, setDeck] = useState<FlashcardDTO[] | null>(null);
  const [vazio, setVazio] = useState(false);
  const [pending, startTransition] = useTransition();

  function iniciar() {
    setVazio(false);
    startTransition(async () => {
      const cards = await gerarFlashcards({
        assuntoId: assuntoId || undefined,
        quantidade,
        vencidos,
      });
      if (cards.length === 0) setVazio(true);
      else setDeck(cards);
    });
  }

  if (deck) {
    return <FlashcardSessao cards={deck} onSair={() => setDeck(null)} />;
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Assunto</p>
          <div className="flex flex-wrap gap-2">
            <Chip ativo={assuntoId === ""} onClick={() => setAssuntoId("")}>
              Todos
            </Chip>
            {assuntos.map((a) => (
              <Chip key={a.id} ativo={assuntoId === a.id} onClick={() => setAssuntoId(a.id)}>
                {a.nome}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Quantidade de cards</p>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30].map((n) => (
              <Chip key={n} ativo={quantidade === n} onClick={() => setQuantidade(n)}>
                {n}
              </Chip>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
          <input
            type="checkbox"
            checked={vencidos}
            onChange={(e) => setVencidos(e.target.checked)}
            className="h-4 w-4 accent-indigo-500"
          />
          <span className="text-sm text-slate-300">
            Apenas cards vencidos na revisão (priorizar o que está atrasado)
          </span>
        </label>

        {vazio && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <AlertCircle className="h-4 w-4" />
            Nenhum card encontrado com esses filtros. Tente outro assunto ou desmarque “apenas
            vencidos”.
          </div>
        )}

        <Button size="lg" className="w-full" onClick={iniciar} disabled={pending}>
          <Layers className="h-4 w-4" />
          {pending ? "Montando baralho..." : "Iniciar flashcards"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
        ativo
          ? "border-indigo-500 bg-indigo-600/15 text-indigo-200"
          : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}
