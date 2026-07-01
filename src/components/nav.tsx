"use client";

import { useState } from "react";
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
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sair } from "@/server/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { BotaoFeedback } from "@/components/botao-feedback";
import { ConcursoSelector } from "@/components/concurso-selector";

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

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
        <GraduationCap className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight text-slate-100">Jade Study</p>
        <ConcursoSelector />
      </div>
    </div>
  );
}

function ItemLink({
  href,
  label,
  Icon,
  ativo,
  onClick,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  ativo: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        ativo
          ? "bg-indigo-600/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function BotaoSair({ className }: { className?: string }) {
  return (
    <form action={sair} className={className}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
      >
        <LogOut className="h-4 w-4" />
        <span>Sair</span>
      </button>
    </form>
  );
}

export function Nav({ nome, isAdmin }: { nome: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const itens = isAdmin
    ? [...links, { href: "/admin/reportes", label: "Reportes", icon: ShieldAlert }]
    : links;

  return (
    <>
      {/* ===== Mobile: barra superior + menu retrátil ===== */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Marca />
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800/60"
          >
            {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {aberto && (
          <div className="max-h-[75vh] overflow-y-auto border-t border-slate-800 px-3 pb-3 pt-2">
            <nav className="flex flex-col gap-1">
              {itens.map(({ href, label, icon: Icon }) => (
                <ItemLink
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  ativo={pathname.startsWith(href)}
                  onClick={() => setAberto(false)}
                />
              ))}
            </nav>
            <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
              <BotaoFeedback className="w-full justify-start" />
              <div className="flex items-center justify-between gap-2">
                <ThemeToggle />
                <BotaoSair />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ===== Desktop: sidebar fixa ===== */}
      <aside className="hidden shrink-0 border-slate-800 bg-slate-950/60 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:px-4 md:py-6">
        <div className="mb-8 px-2">
          <Marca />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {itens.map(({ href, label, icon: Icon }) => (
            <ItemLink
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              ativo={pathname.startsWith(href)}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-xl bg-slate-900/60 px-3 py-2">
            <p className="text-xs text-slate-500">Conectada como</p>
            <p className="truncate text-sm font-medium text-slate-200">{nome}</p>
          </div>
          <BotaoFeedback className="justify-start" />
          <ThemeToggle className="justify-start" />
          <BotaoSair />
        </div>
      </aside>
    </>
  );
}
