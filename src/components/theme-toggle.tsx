"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// Le o tema atual direto da classe do <html> (fonte de verdade, controlada pelo
// script anti-flash e por este botao). useSyncExternalStore + MutationObserver
// evita setState-em-effect e mantem o icone em sincronia.
function subscribe(callback: () => void) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
function getSnapshot(): "light" | "dark" {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}
function getServerSnapshot(): "light" | "dark" {
  return "dark";
}

/** Botao de alternancia claro/escuro. Persiste a escolha em localStorage e
 *  alterna a classe `light`/`dark` no <html> (lida pelo globals.css). */
export function ThemeToggle({ className }: { className?: string }) {
  const tema = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const escuro = tema === "dark";

  function alternar() {
    const novo = escuro ? "light" : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(novo);
    try {
      localStorage.setItem("theme", novo);
    } catch {}
    // O MutationObserver acima dispara o re-render via useSyncExternalStore.
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200",
        className
      )}
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden md:inline">{escuro ? "Modo claro" : "Modo escuro"}</span>
    </button>
  );
}
