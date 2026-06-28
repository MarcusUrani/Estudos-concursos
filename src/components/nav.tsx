"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  GraduationCap,
  LogOut,
  Star,
  XCircle,
  History,
  TimerReset,
  Sparkles,
  CalendarClock,
  Layers,
  BookText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sair } from "@/server/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treino", label: "Treino", icon: Dumbbell },
  { href: "/revisao", label: "Revisão", icon: CalendarClock },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/estudar", label: "Estudar", icon: BookText },
  { href: "/simulado", label: "Simulado", icon: TimerReset },
  { href: "/favoritas", label: "Favoritas", icon: Star },
  { href: "/erradas", label: "Que errei", icon: XCircle },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/conquistas", label: "Conquistas", icon: Sparkles },
];

export function Nav({ nome }: { nome: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-row items-center gap-2 border-b border-slate-800 bg-slate-950/60 px-4 py-3 md:h-screen md:w-64 md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-4 md:py-6">
      <div className="flex items-center gap-2.5 md:mb-8 md:px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-semibold leading-tight text-slate-100">Estuda</p>
          <p className="text-xs leading-tight text-indigo-400">SEDES-DF</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-row gap-1 md:flex-col">
        {links.map(({ href, label, icon: Icon }) => {
          const ativo = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                ativo
                  ? "bg-indigo-600/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 md:mt-auto md:flex-col md:items-stretch md:gap-3">
        <div className="hidden rounded-xl bg-slate-900/60 px-3 py-2 md:block">
          <p className="text-xs text-slate-500">Conectada como</p>
          <p className="truncate text-sm font-medium text-slate-200">{nome}</p>
        </div>
        <ThemeToggle className="md:justify-start" />
        <form action={sair}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
