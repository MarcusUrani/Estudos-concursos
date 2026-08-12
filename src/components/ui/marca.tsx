import { cn } from "@/lib/utils";

/** Identidade do Gabarix. Duas construcoes, cada uma com o seu contexto:
 *
 *  - `MarcaSimbolo` (meia-marca): o anel com a metade preenchida na diagonal,
 *    uma bolha de gabarito no instante em que a caneta a preenche. Quadrada por
 *    natureza — e a versao de icone, favicon e sidebar.
 *  - `MarcaSequencia`: quatro bolhas, tres marcadas e uma por marcar. Explicita
 *    o "gabarito + progresso" e so aparece no lockup horizontal.
 *
 *  As duas herdam a cor via `currentColor`, entao seguem o tema sem duplicacao.
 */

export function MarcaSimbolo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 84 84"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
    >
      {/* O recorte diagonal e o que da o gesto: a tinta entrou por baixo e a
          direita, como quem preenche a bolha sem levantar a caneta.
          A metade e um arco explicito, e nao um `clipPath`: o componente
          aparece duas vezes na mesma pagina (cabecalho mobile + sidebar) e um
          `id` fixo dentro de `defs` duplicaria id no DOM. */}
      <path d="M17.25 66.75 A35 35 0 0 0 66.75 17.25 Z" fill="currentColor" />
      <circle cx="42" cy="42" r="34" stroke="currentColor" strokeWidth="8" />
    </svg>
  );
}

export function MarcaSequencia({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 34"
      fill="none"
      aria-hidden="true"
      className={cn("h-5 w-auto", className)}
    >
      <circle cx="17" cy="17" r="14" fill="currentColor" />
      <circle cx="49" cy="17" r="14" fill="currentColor" />
      <circle cx="81" cy="17" r="14" fill="currentColor" />
      <circle cx="113" cy="17" r="11.5" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}

/** Lockup horizontal: sequencia + palavra. Usar onde a marca se apresenta
 *  (login, cabecalho de e-mail), nao onde ela so identifica (sidebar). */
export function MarcaLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <MarcaSequencia className="h-4 w-auto text-indigo-600" />
      <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-slate-100">
        Gabarix
      </span>
    </span>
  );
}
