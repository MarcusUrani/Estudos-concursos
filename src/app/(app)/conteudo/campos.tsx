"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

/** Pecas de formulario compartilhadas pelas abas do admin. Ficam num arquivo
 *  proprio para que `ia-form` possa usa-las sem importar de `conteudo-client`,
 *  que por sua vez importa `ia-form` — o que fecharia um ciclo. */

export const inputCls =
  "w-full rounded-sm border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export const textareaCls = cn(inputCls, "resize-y");

export function Feedback({ erro, ok }: { erro?: string | null; ok?: string | null }) {
  if (!erro && !ok) return null;
  return erro ? (
    <div className="flex items-start gap-2 rounded-sm bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="whitespace-pre-wrap">{erro}</span>
    </div>
  ) : (
    <div className="flex items-start gap-2 rounded-sm bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="whitespace-pre-wrap">{ok}</span>
    </div>
  );
}

export function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-300">{label}</p>
      {children}
    </div>
  );
}
