"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { enviarFeedback } from "@/server/feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIPOS = ["Sugestão", "Erro / bug", "Melhoria", "Outro"];

/** Botao + modal para enviar feedback/sugestao geral da plataforma (por e-mail). */
export function BotaoFeedback({ className }: { className?: string }) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function fechar() {
    setAberto(false);
    setTimeout(() => {
      setTipo(TIPOS[0]);
      setMensagem("");
      setEnviado(false);
      setErro(null);
    }, 200);
  }

  function enviar() {
    if (!mensagem.trim()) return;
    setErro(null);
    startTransition(async () => {
      const r = await enviarFeedback({
        tipo,
        mensagem,
        pagina: typeof window !== "undefined" ? window.location.pathname : undefined,
      });
      if (r.ok) setEnviado(true);
      else setErro(r.erro);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200",
          className
        )}
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span>Sugestões</span>
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
                  <MessageSquarePlus className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-100">Enviar feedback</h2>
                </div>
                <button onClick={fechar} aria-label="Fechar" className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {enviado ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-slate-300">
                    Feedback enviado. Obrigado por ajudar a melhorar a plataforma!
                  </p>
                  <Button onClick={fechar}>Fechar</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Encontrou um erro ou tem uma ideia? Conte pra gente.
                  </p>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-300">Tipo</p>
                    <div className="flex flex-wrap gap-2">
                      {TIPOS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipo(t)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                            tipo === t
                              ? "border-indigo-500 bg-indigo-600/15 text-indigo-200"
                              : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="feedback-msg" className="mb-2 block text-sm font-medium text-slate-300">
                      Mensagem
                    </label>
                    <textarea
                      id="feedback-msg"
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      rows={5}
                      maxLength={3000}
                      placeholder="Descreva o erro ou a sugestão…"
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
                    <Button onClick={enviar} disabled={!mensagem.trim() || pending}>
                      {pending ? "Enviando…" : "Enviar"}
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
