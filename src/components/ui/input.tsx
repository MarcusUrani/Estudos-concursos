import * as React from "react";
import { cn } from "@/lib/utils";

/** Campo de formulario oficial: retangular, borda solida, fundo da propria folha.
 *  O `focus-visible` global (globals.css) desenha o contorno ultramarino. */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-sm border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 transition-colors placeholder:text-slate-500 hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
