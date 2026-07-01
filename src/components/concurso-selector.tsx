"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Concurso atualmente estudado. Por enquanto so o SEDES-DF esta disponivel;
// os demais aparecem como "em breve". Quando houver mais bancos de conteudo,
// basta marcar `disponivel: true` (e ligar a troca real no back-end).
const CONCURSOS: { id: string; nome: string; disponivel: boolean }[] = [
  { id: "sedes-df", nome: "SEDES-DF", disponivel: true },
];

export function ConcursoSelector() {
  const [aberto, setAberto] = useState(false);
  const [atualId, setAtualId] = useState("sedes-df");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const atual = CONCURSOS.find((c) => c.id === atualId) ?? CONCURSOS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Selecionar concurso"
        aria-expanded={aberto}
        className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
      >
        {atual.nome}
        <ChevronDown className={cn("h-3 w-3 transition-transform", aberto && "rotate-180")} />
      </button>

      {aberto && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-52 rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-2xl">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Concurso
          </p>
          {CONCURSOS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setAtualId(c.id);
                setAberto(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800"
            >
              {c.nome}
              {c.id === atual.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
            </button>
          ))}
          <div className="mt-1 flex items-center gap-1.5 border-t border-slate-800 px-2 pb-1 pt-2 text-xs text-slate-500">
            <Lock className="h-3 w-3" />
            Mais concursos em breve
          </div>
        </div>
      )}
    </div>
  );
}
