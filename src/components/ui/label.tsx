import * as React from "react";
import { cn } from "@/lib/utils";

/** Rotulo de campo no mesmo registro das etiquetas de secao: mono, caixa alta,
 *  pequeno. Diz "isto e um campo" sem competir com o valor digitado. */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block font-mono text-[0.6875rem] uppercase leading-none tracking-[0.12em] text-slate-500",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
