"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2, Users, Eye } from "lucide-react";
import {
  criarNotificacao,
  excluirNotificacao,
  type NotificacaoAdminDTO,
} from "@/server/notificacoes";
import type { ConcursoDTO } from "@/server/concurso";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TIPOS, tipoDe, MAX_CORPO, MAX_TITULO, type TipoNotificacao } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-sm border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function AdminNotificacoesClient({
  notificacoes,
  concursos,
}: {
  notificacoes: NotificacaoAdminDTO[];
  concursos: ConcursoDTO[];
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoNotificacao>("novidade");
  // Vazio = todos os concursos. E o padrao de proposito: o comunicado geral e o
  // caso comum, e restringir deve ser uma escolha consciente.
  const [concursoId, setConcursoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviada, setEnviada] = useState<string | null>(null);
  const [enviando, start] = useTransition();
  const [excluindo, startExcluir] = useTransition();

  const alcance = concursoId
    ? concursos.find((c) => c.id === concursoId)?.nome ?? "concurso selecionado"
    : "todos os usuários";
  const podeEnviar = titulo.trim().length >= 3 && corpo.trim().length >= 3;

  function enviar() {
    setErro(null);
    setEnviada(null);
    start(async () => {
      const r = await criarNotificacao({ tipo, titulo, corpo, concursoId });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setTitulo("");
      setCorpo("");
      setEnviada(`Notificação enviada para ${alcance}.`);
      router.refresh();
    });
  }

  function excluir(id: string, titulo: string) {
    if (!confirm(`Excluir a notificação "${titulo}"? Ela some para todos os usuários.`)) return;
    setErro(null);
    startExcluir(async () => {
      const r = await excluirNotificacao(id);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4 text-indigo-400" />
            Nova notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Tipo</p>
            {/* Botoes e nao <select>: sao quatro opcoes fixas e cada uma tem
                cor propria — ver a cor antes de escolher evita mandar uma
                manutencao com a cara de novidade. */}
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id)}
                  aria-pressed={tipo === t.id}
                  className={cn(
                    "rounded-sm border px-3 py-2 text-sm transition-colors",
                    tipo === t.id
                      ? "border-indigo-600 bg-indigo-600/10 font-medium text-slate-100"
                      : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  )}
                >
                  {t.rotulo}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{tipoDe(tipo).ajuda}</p>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Concurso</p>
            <select
              value={concursoId}
              onChange={(e) => setConcursoId(e.target.value)}
              disabled={enviando}
              className={inputCls}
            >
              <option value="">Todos os concursos</option>
              {concursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="h-3.5 w-3.5 shrink-0" />
              Será enviada para <span className="font-medium text-slate-300">{alcance}</span>.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-slate-300">Título</p>
              <span
                className={cn(
                  "tabular text-xs",
                  titulo.length > MAX_TITULO ? "text-rose-300" : "text-slate-500"
                )}
              >
                {titulo.length}/{MAX_TITULO}
              </span>
            </div>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={enviando}
              placeholder="Ex.: Nova aba para corrigir redação escrita fora da plataforma"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-slate-300">Corpo</p>
              <span
                className={cn(
                  "tabular text-xs",
                  corpo.length > MAX_CORPO ? "text-rose-300" : "text-slate-500"
                )}
              >
                {corpo.length}/{MAX_CORPO}
              </span>
            </div>
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={6}
              disabled={enviando}
              className={cn(inputCls, "resize-y leading-relaxed", enviando && "opacity-60")}
              placeholder="O que mudou, o que a pessoa precisa fazer e a partir de quando vale."
            />
          </div>

          {erro && <p className="rounded-sm bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{erro}</p>}
          {enviada && (
            <p className="rounded-sm bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {enviada}
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={enviar} disabled={!podeEnviar || enviando}>
              <Send className="h-4 w-4" />
              {enviando ? "Enviando…" : "Enviar notificação"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="etiqueta mb-3 border-b border-slate-800 pb-2">
          Enviadas ({notificacoes.length})
        </p>

        {notificacoes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-slate-400">
              Nenhuma notificação enviada ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notificacoes.map((n) => {
              const t = tipoDe(n.tipo);
              return (
                <Card key={n.id} className="min-w-0">
                  <CardContent className="p-4 sm:p-5">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={t.variante}>{t.rotulo}</Badge>
                      <Badge variant="neutral">{n.concurso ?? "Todos os concursos"}</Badge>
                      <span className="tabular ml-auto shrink-0 text-xs text-slate-500">
                        {fmtData.format(new Date(n.criadaEm))}
                      </span>
                    </div>

                    <p className="font-display text-sm font-semibold wrap-break-word text-slate-100">
                      {n.titulo}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line wrap-break-word text-slate-400">
                      {n.corpo}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        <span className="tabular">{n.leituras}</span>
                        {n.leituras === 1 ? "leitura" : "leituras"}
                        {n.autor && <span className="text-slate-600">· por {n.autor}</span>}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={excluindo}
                        onClick={() => excluir(n.id, n.titulo)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
