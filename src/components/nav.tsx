"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
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
  FolderPlus,
  PenLine,
  Bell,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarcaSimbolo } from "@/components/ui/marca";
import { sair } from "@/server/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { BotaoFeedback } from "@/components/botao-feedback";
import { ConcursoSelector } from "@/components/concurso-selector";
import type { ConcursoDTO } from "@/server/concurso";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treino", label: "Treino", icon: Dumbbell },
  { href: "/revisao", label: "Revisão", icon: CalendarClock },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/estudar", label: "Estudar", icon: BookText },
  { href: "/simulado", label: "Simulado", icon: TimerReset },
  { href: "/redacao", label: "Redação", icon: PenLine },
  { href: "/favoritas", label: "Favoritas", icon: Star },
  { href: "/erradas", label: "Que errei", icon: XCircle },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/conquistas", label: "Conquistas", icon: Sparkles },
  // Aberto a todos: criar materia/assunto e gerar questoes por IA. As abas de
  // cadastro manual e material de estudo continuam so para admin, dentro da
  // propria pagina.
  { href: "/conteudo", label: "Conteúdo", icon: FolderPlus },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
];

function Marca({
  concursos,
  concursoAtualId,
}: Pick<NavProps, "concursos" | "concursoAtualId">) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Bloco solido de tinta, sem brilho: um carimbo, nao um icone de app.
          Aqui a marca so identifica, entao vai a meia-marca — o lockup completo
          fica reservado para o login. */}
      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-indigo-600">
        <MarcaSimbolo className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-display text-sm font-bold leading-tight tracking-tight text-slate-100">
          Gabarix
        </p>
        <ConcursoSelector concursos={concursos} atualId={concursoAtualId} />
      </div>
    </div>
  );
}

/** Bolinha com o numero de nao lidas. Some quando zera — contador com "0" e
 *  ruido: informa que nao ha nada para informar. */
function Contador({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5",
        "text-[0.6875rem] font-bold leading-none text-white",
        className,
      )}
    >
      {n > 9 ? "9+" : n}
    </span>
  );
}

function ItemLink({
  href,
  label,
  Icon,
  ativo,
  contador = 0,
  onClick,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  ativo: boolean;
  contador?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        // O item ativo e marcado por uma barra de tinta na margem — o gesto de
        // marcar a linha onde se parou, em vez de uma pilula colorida.
        "flex items-center gap-3 border-l-2 py-2 pl-3 pr-3 text-sm transition-colors",
        ativo
          ? "border-indigo-600 bg-indigo-600/8 font-semibold text-slate-100"
          : "border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
      <Contador n={contador} className="ml-auto" />
    </Link>
  );
}

function BotaoSair({ className }: { className?: string }) {
  return (
    <form action={sair} className={className}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-600/10 hover:text-rose-300"
      >
        <LogOut className="h-4 w-4" />
        <span>Sair</span>
      </button>
    </form>
  );
}

type NavProps = {
  nome: string;
  isAdmin?: boolean;
  podeRevisar?: boolean;
  concursos: ConcursoDTO[];
  concursoAtualId: string | null;
  /** Notificacoes do sistema ainda nao lidas por quem esta logado. */
  naoLidas?: number;
};

export function Nav({
  nome,
  isAdmin,
  podeRevisar = true,
  concursos,
  concursoAtualId,
  naoLidas = 0,
}: NavProps) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const base = podeRevisar ? links : links.filter((l) => l.href !== "/revisao");
  const itens = isAdmin
    ? [
        ...base,
        { href: "/admin/reportes", label: "Reportes", icon: ShieldAlert },
        { href: "/admin/notificacoes", label: "Enviar aviso", icon: Megaphone },
      ]
    : base;

  return (
    <>
      {/* ===== Mobile: barra superior + menu retrátil ===== */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Marca concursos={concursos} concursoAtualId={concursoAtualId} />
          <div className="flex items-center gap-1">
            {/* Fora do menu retratil de proposito: aviso que so aparece depois
                de dois toques nao avisa nada. Aqui o numero fica visivel em
                qualquer tela, e o destino esta a um toque. */}
            <Link
              href="/notificacoes"
              onClick={() => setAberto(false)}
              aria-label={
                naoLidas > 0
                  ? `Notificações, ${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}`
                  : "Notificações"
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-sm text-slate-300 transition-colors hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />
              <Contador n={naoLidas} className="absolute right-1 top-1" />
            </Link>
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={aberto}
              className="flex h-10 w-10 items-center justify-center rounded-sm text-slate-300 transition-colors hover:bg-slate-800"
            >
              {aberto ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
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
                  contador={href === "/notificacoes" ? naoLidas : 0}
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
      <aside className="hidden shrink-0 border-slate-800 bg-slate-950 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:py-6">
        <div className="mb-8 px-5">
          <Marca concursos={concursos} concursoAtualId={concursoAtualId} />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 pl-3 pr-4">
          {itens.map(({ href, label, icon: Icon }) => (
            <ItemLink
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              ativo={pathname.startsWith(href)}
              contador={href === "/notificacoes" ? naoLidas : 0}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 px-4">
          <div className="border-t border-slate-800 pt-3">
            <p className="etiqueta">Conectada como</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-200">
              {nome}
            </p>
          </div>
          <BotaoFeedback className="justify-start" />
          <ThemeToggle className="justify-start" />
          <BotaoSair />
        </div>
      </aside>
    </>
  );
}
