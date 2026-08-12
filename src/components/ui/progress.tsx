import { cn } from "@/lib/utils";

/** Barra reta, sem ponta arredondada: e uma regua de preenchimento, o mesmo
 *  gesto de marcar uma linha ate onde se chegou. Fina de proposito — o numero
 *  ao lado dela e que carrega o dado; a barra so da a proporcao. */
export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden bg-slate-800", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full bg-indigo-600 transition-[width] duration-300", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
