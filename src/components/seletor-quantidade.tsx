"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

/**
 * Seletor amigavel de quantidade: um slider (de 5 em 5) com o valor em
 * destaque e botoes -/+ para ajuste fino. Usado no Treino e no Simulado.
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
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums text-indigo-300">{value}</span>
          <span className="text-sm text-slate-400">questões</span>
        </div>
        <div className="flex items-center gap-2">
          <StepBtn
            aria-label="Diminuir"
            disabled={value <= min}
            onClick={() => onChange(clamp(value - step))}
          >
            <Minus className="h-4 w-4" />
          </StepBtn>
          <StepBtn
            aria-label="Aumentar"
            disabled={value >= max}
            onClick={() => onChange(clamp(value + step))}
          >
            <Plus className="h-4 w-4" />
          </StepBtn>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Quantidade de questões"
        className="w-full cursor-pointer accent-indigo-500"
        style={{
          // trilho preenchido ate o valor atual (fallback caso accent-color nao pinte)
          background: `linear-gradient(to right, rgb(99 102 241 / 0.5) ${pct}%, rgb(30 41 59 / 0.6) ${pct}%)`,
          height: 6,
          borderRadius: 999,
          appearance: "none",
          WebkitAppearance: "none",
        }}
      />

      <div className="mt-1.5 flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100",
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
