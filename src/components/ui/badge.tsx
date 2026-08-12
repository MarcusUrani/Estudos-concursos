import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Etiqueta de arquivo, nao pilula. Retangular, mono, caixa alta e tracking
 *  aberto: e o carimbo que classifica a questao (banca, nivel, situacao).
 *  A borda solida no lugar do `ring` translucido mantem a leitura no papel. */
const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.08em]",
  {
    variants: {
      variant: {
        // Os tons 300 sao remapeados para tons escuros no tema papel pelo bloco
        // `html:not(.dark)` do globals.css. Usar 700 fixo aqui quebraria o escuro.
        default: "border-indigo-600/35 bg-indigo-600/10 text-indigo-300",
        neutral: "border-slate-700 bg-slate-800/60 text-slate-400",
        success: "border-emerald-600/35 bg-emerald-600/10 text-emerald-300",
        warning: "border-amber-600/35 bg-amber-600/10 text-amber-300",
        danger: "border-rose-600/35 bg-rose-600/10 text-rose-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
