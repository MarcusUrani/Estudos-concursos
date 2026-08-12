import * as React from "react";
import { cn } from "@/lib/utils";

/** Superficie documental: regua de 1px e canto de 4px, sem sombra e sem desfoque.
 *  A separacao vem da borda, nao de profundidade falsa — e uma folha sobre a mesa,
 *  nao um painel de vidro flutuando. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-sm border border-slate-800 bg-slate-900", className)}
      {...props}
    />
  );
}

/** Cabecalho com regua inferior: o cartao vira um campo de formulario oficial,
 *  com o rotulo separado do conteudo por uma linha, nao por espaco vazio. */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-b border-slate-800 px-5 py-4", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-base font-semibold text-slate-100", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center border-t border-slate-800 px-5 py-3", className)}
      {...props}
    />
  );
}
