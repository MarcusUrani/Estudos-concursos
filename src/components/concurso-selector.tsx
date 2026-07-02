"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { selecionarConcurso } from "@/server/concurso-actions";
import type { ConcursoDTO } from "@/server/concurso";

/**
 * Seletor de concurso no logo. Troca o concurso atual (persistido em cookie) e
 * recarrega o conteudo. Quando houver mais de um concurso no banco, todos
 * aparecem aqui automaticamente.
 */
export function ConcursoSelector({
  concursos,
  atualId,
}: {
  concursos: ConcursoDTO[];
  atualId: string | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const atual = concursos.find((c) => c.id === atualId) ?? concursos[0];

  function trocar(id: string) {
    setAberto(false);
    if (id === atual?.id) return;
    startTransition(async () => {
      await selecionarConcurso(id);
      router.refresh();
    });
  }

  if (!atual) {
    return <span className="text-xs text-slate-500">Sem concurso</span>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Selecionar concurso"
        aria-expanded={aberto}
        disabled={pending}
        className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300 disabled:opacity-60"
      >
        {atual.sigla ?? atual.nome}
        <ChevronDown className={cn("h-3 w-3 transition-transform", aberto && "rotate-180")} />
      </button>

      {aberto && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-2xl">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Concurso
          </p>
          {concursos.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => trocar(c.id)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800"
            >
              <span className="truncate">{c.nome}</span>
              {c.id === atual.id && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-400" />}
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
