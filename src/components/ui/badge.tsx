import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30",
        neutral: "bg-slate-700/40 text-slate-300 ring-1 ring-inset ring-slate-600/40",
        success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
        warning: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
        danger: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30",
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
