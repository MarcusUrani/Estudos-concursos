"use client";

import { useState, useTransition } from "react";
import { NotebookPen, Save, Trash2, X } from "lucide-react";
import {
  salvarResumoPessoal,
  excluirResumoPessoal,
  type ResumoPessoalDTO,
} from "@/server/resumo-pessoal";
import { MAX_RESUMO } from "@/lib/resumo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* =============================================================================
   Meu resumo

   O caderno da pessoa, ao lado do material do admin e do resumo derivado das
   questoes. Tres estados: vazio (convite), lendo, escrevendo.

   Nao ha salvamento automatico de proposito. Este texto e escrito devagar, com
   pausas longas para consultar a lei, e um autosave transformaria cada pausa
   numa gravacao — sem que a pessoa soubesse dizer qual versao esta valendo.
   O botao diz quando gravou.
   ============================================================================= */

const fmtQuando = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function MeuResumo({
  assuntoId,
  inicial,
}: {
  assuntoId: string;
  inicial: ResumoPessoalDTO | null;
}) {
  const [resumo, setResumo] = useState<ResumoPessoalDTO | null>(inicial);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(inicial?.texto ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, start] = useTransition();

  const sujo = rascunho.trim() !== (resumo?.texto ?? "").trim();

  function abrir() {
    setRascunho(resumo?.texto ?? "");
    setErro(null);
    setEditando(true);
  }

  function cancelar() {
    // Descartar texto novo sem avisar seria perder trabalho da pessoa.
    if (sujo && !confirm("Descartar as alterações não salvas?")) return;
    setRascunho(resumo?.texto ?? "");
    setErro(null);
    setEditando(false);
  }

  function salvar() {
    setErro(null);
    start(async () => {
      const r = await salvarResumoPessoal({ assuntoId, texto: rascunho });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setResumo(r.dados);
      setEditando(false);
    });
  }

  function excluir() {
    if (!confirm("Excluir o seu resumo deste tema? O texto não volta.")) return;
    setErro(null);
    start(async () => {
      const r = await excluirResumoPessoal(assuntoId);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setResumo(null);
      setRascunho("");
      setEditando(false);
    });
  }

  const titulo = (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
      <NotebookPen className="h-4 w-4" />
      Meu resumo
    </p>
  );

  // ---------------------------------------------------------------- escrevendo
  if (editando) {
    return (
      <Card className="border-emerald-700/40 bg-emerald-500/5">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {titulo}
            <span
              className={cn(
                "tabular text-xs",
                rascunho.length > MAX_RESUMO ? "text-rose-300" : "text-slate-500"
              )}
            >
              {rascunho.length.toLocaleString("pt-BR")} caracteres
            </span>
          </div>

          <textarea
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            rows={14}
            disabled={salvando}
            autoFocus
            className={cn(
              "w-full resize-y rounded-sm border border-slate-700 bg-slate-950/50 px-3 py-2",
              "text-sm leading-relaxed text-slate-100 placeholder:text-slate-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              salvando && "opacity-60"
            )}
            placeholder="O que você precisa lembrar deste tema: artigos que caem, pegadinhas, o que já errou."
          />

          {erro && <p className="text-sm text-rose-300">{erro}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={cancelar} disabled={salvando}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button size="sm" onClick={salvar} disabled={salvando || !rascunho.trim()}>
              <Save className="h-4 w-4" />
              {salvando ? "Salvando…" : "Salvar resumo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------- vazio
  if (!resumo) {
    return (
      <Card className="border-dashed border-slate-700 bg-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            {titulo}
            <p className="mt-1.5 text-sm text-slate-400">
              Escreva o seu resumo deste tema. Ele é só seu e você reescreve quando quiser.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={abrir}>
            <NotebookPen className="h-4 w-4" />
            Escrever
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------- lendo
  return (
    <Card className="border-emerald-700/40 bg-emerald-500/5">
      <CardContent className="space-y-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {titulo}
          <span className="tabular text-xs text-slate-500">
            atualizado em {fmtQuando.format(new Date(resumo.atualizadoEm))}
          </span>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-slate-200">
          {resumo.texto}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-700/25 pt-3">
          <Button variant="ghost" size="sm" onClick={excluir} disabled={salvando}>
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
          <Button variant="secondary" size="sm" onClick={abrir} disabled={salvando}>
            <NotebookPen className="h-3.5 w-3.5" />
            Editar
          </Button>
        </div>

        {erro && <p className="text-sm text-rose-300">{erro}</p>}
      </CardContent>
    </Card>
  );
}
