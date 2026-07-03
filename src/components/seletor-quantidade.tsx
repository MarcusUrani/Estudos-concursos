"use client";

import { cn } from "@/lib/utils";

/**
 * Seletor de quantidade por botoes: opcoes de 5 em 5 (por padrao 5 a 50).
 * Usado no Treino e no Simulado.
 */
export function SeletorQuantidade({
  value,
  onChange,
  min = 5,
  max = 50,
  step = 5,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const opcoes: number[] = [];
  for (let n = min; n <= max; n += step) opcoes.push(n);

  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={cn(
            "min-w-11 rounded-xl border px-3.5 py-2 text-sm font-medium tabular-nums transition-all",
            value === n
              ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
              : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
