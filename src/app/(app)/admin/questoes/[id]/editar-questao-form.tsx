"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { atualizarQuestao, type QuestaoEdicaoDTO } from "@/server/admin-questoes";
import { NIVEIS } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from "lucide-react";

export function EditarQuestaoForm({ questao }: { questao: QuestaoEdicaoDTO }) {
  const router = useRouter();
  const [enunciado, setEnunciado] = useState(questao.enunciado);
  const [nivel, setNivel] = useState(questao.nivel);
  const [explicacao, setExplicacao] = useState(questao.explicacao);
  const [fonteLegal, setFonteLegal] = useState(questao.fonteLegal ?? "");
  const [alternativas, setAlternativas] = useState(
    questao.alternativas.map((a) => ({ id: a.id, texto: a.texto, correta: a.correta }))
  );
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function setTextoAlt(id: string, texto: string) {
    setAlternativas((prev) => prev.map((a) => (a.id === id ? { ...a, texto } : a)));
  }
  function marcarCorreta(id: string) {
    setAlternativas((prev) => prev.map((a) => ({ ...a, correta: a.id === id })));
  }

  function salvar() {
    setErro(null);
    setOk(false);
    startTransition(async () => {
      try {
        await atualizarQuestao({
          questaoId: questao.id,
          enunciado,
          nivel,
          explicacao,
          fonteLegal,
          alternativas,
        });
        setOk(true);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/reportes"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos reportes
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">Editar questão</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge>{questao.assunto}</Badge>
          {questao.subassunto && <Badge variant="neutral">{questao.subassunto}</Badge>}
          <Badge variant="neutral">{questao.banca}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <Campo label="Enunciado">
            <textarea
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              rows={4}
              className={textareaCls}
            />
          </Campo>

          <Campo label="Nível">
            <div className="flex flex-wrap gap-2">
              {NIVEIS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivel(n)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    nivel === n
                      ? "border-indigo-500 bg-indigo-600/15 text-indigo-200"
                      : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Campo>

          <Campo label="Alternativas (marque a correta)">
            <div className="space-y-2">
              {alternativas.map((a, i) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3",
                    a.correta
                      ? "border-emerald-500/60 bg-emerald-500/5"
                      : "border-slate-700 bg-slate-950/40"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => marcarCorreta(a.id)}
                    title="Marcar como correta"
                    className={cn(
                      "mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                      a.correta
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-600 text-slate-500 hover:border-slate-400"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                  <textarea
                    value={a.texto}
                    onChange={(e) => setTextoAlt(a.id, e.target.value)}
                    rows={2}
                    className={cn(textareaCls, "min-h-0")}
                  />
                </div>
              ))}
            </div>
          </Campo>

          <Campo label="Comentário / explicação">
            <textarea
              value={explicacao}
              onChange={(e) => setExplicacao(e.target.value)}
              rows={4}
              className={textareaCls}
            />
          </Campo>

          <Campo label="Base legal">
            <Input value={fonteLegal} onChange={(e) => setFonteLegal(e.target.value)} />
          </Campo>

          {erro && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {erro}
            </div>
          )}
          {ok && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Alterações salvas.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.push("/admin/reportes")} disabled={pending}>
              Voltar
            </Button>
            <Button onClick={salvar} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const textareaCls =
  "w-full resize-y rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-300">{label}</p>
      {children}
    </div>
  );
}
