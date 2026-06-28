"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, Check, CheckCircle2, AlertCircle } from "lucide-react";
import { reportarQuestao } from "@/server/reportes";
import { MOTIVOS_REPORTE } from "@/lib/reportes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Botao + modal para reportar uma questao (gabarito errado, comentario errado, etc.). */
export function BotaoReporte({ questaoId, className }: { questaoId: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function alternar(id: string) {
    setMotivos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function fechar() {
    setAberto(false);
    // Reseta o estado depois da animacao de saida.
    setTimeout(() => {
      setMotivos([]);
      setComentario("");
      setEnviado(false);
      setErro(null);
    }, 200);
  }

  function enviar() {
    if (motivos.length === 0) return;
    setErro(null);
    startTransition(async () => {
      try {
        await reportarQuestao(questaoId, motivos, comentario);
        setEnviado(true);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível enviar o reporte.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        title="Reportar questão"
        aria-label="Reportar questão"
        className={cn(
          "text-slate-400 transition-colors hover:text-rose-400",
          className
        )}
      >
        <Flag className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={fechar} />
            <motion.div
              className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-slate-100">Reportar questão</h2>
                </div>
                <button
                  onClick={fechar}
                  aria-label="Fechar"
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {enviado ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-slate-300">
                    Reporte enviado. Obrigado por ajudar a melhorar o banco de questões!
                  </p>
                  <Button onClick={fechar}>Fechar</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-300">
                      Motivo <span className="text-slate-500">(selecione um ou mais)</span>
                    </p>
                    <div className="space-y-2">
                      {MOTIVOS_REPORTE.map((m) => {
                        const marcado = motivos.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => alternar(m.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                              marcado
                                ? "border-indigo-500 bg-indigo-600/15 text-slate-100"
                                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                marcado
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-slate-600"
                              )}
                            >
                              {marcado && <Check className="h-3.5 w-3.5" />}
                            </span>
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reporte-comentario" className="mb-2 block text-sm font-medium text-slate-300">
                      Detalhes <span className="text-slate-500">(opcional)</span>
                    </label>
                    <textarea
                      id="reporte-comentario"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Descreva o problema, se quiser…"
                      className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </div>

                  {erro && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {erro}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={fechar} disabled={pending}>
                      Cancelar
                    </Button>
                    <Button onClick={enviar} disabled={motivos.length === 0 || pending}>
                      {pending ? "Enviando…" : "Enviar reporte"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
