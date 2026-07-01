"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export type AssuntoSel = { id: string; nome: string; total: number; materia: string };

function agrupar(assuntos: AssuntoSel[]): { materia: string; itens: AssuntoSel[] }[] {
  const grupos: { materia: string; itens: AssuntoSel[] }[] = [];
  for (const a of assuntos) {
    let g = grupos.find((x) => x.materia === a.materia);
    if (!g) {
      g = { materia: a.materia, itens: [] };
      grupos.push(g);
    }
    g.itens.push(a);
  }
  return grupos;
}

/**
 * Seletor de assuntos em acordeao: cada materia e um cabecalho clicavel que
 * abre/fecha os assuntos daquela materia. Todas comecam fechadas. Multi-selecao.
 */
export function SeletorAssuntos({
  assuntos,
  selecionados,
  onAlternar,
  onLimpar,
  desabilitarVazios = false,
  mostrarTotal = false,
}: {
  assuntos: AssuntoSel[];
  selecionados: string[];
  onAlternar: (id: string) => void;
  onLimpar: () => void;
  desabilitarVazios?: boolean;
  mostrarTotal?: boolean;
}) {
  const [abertas, setAbertas] = useState<string[]>([]);
  const grupos = agrupar(assuntos);
  const selSet = new Set(selecionados);

  function toggleMateria(m: string) {
    setAbertas((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {selecionados.length
            ? `${selecionados.length} assunto(s) selecionado(s)`
            : "Nenhum selecionado = todos"}
        </span>
        {selecionados.length > 0 && (
          <button
            type="button"
            onClick={onLimpar}
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Limpar seleção
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800">
        {grupos.map((g) => {
          const aberta = abertas.includes(g.materia);
          const selNaMateria = g.itens.filter((a) => selSet.has(a.id)).length;
          return (
            <div key={g.materia}>
              <button
                type="button"
                onClick={() => toggleMateria(g.materia)}
                aria-expanded={aberta}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-800/40"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                    aberta && "rotate-180"
                  )}
                />
                <span className="flex-1 text-sm font-medium text-slate-200">{g.materia}</span>
                {selNaMateria > 0 && (
                  <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                    {selNaMateria}
                  </span>
                )}
                <span className="text-xs text-slate-500">{g.itens.length}</span>
              </button>

              {aberta && (
                <div className="flex flex-wrap gap-2 bg-slate-950/30 px-4 pb-4 pt-1">
                  {g.itens.map((a) => {
                    const ativo = selSet.has(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        disabled={desabilitarVazios && a.total === 0}
                        onClick={() => onAlternar(a.id)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40",
                          ativo
                            ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
                            : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"
                        )}
                      >
                        {ativo && <Check className="mr-1 inline h-3.5 w-3.5" />}
                        {a.nome}
                        {mostrarTotal && <span className="ml-1 text-xs opacity-60">{a.total}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
