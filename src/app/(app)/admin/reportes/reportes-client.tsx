"use client";

import { useState, useTransition } from "react";
import { alternarStatusReporte, type ReporteDTO } from "@/server/reportes";
import { rotuloMotivo } from "@/lib/reportes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flag, CheckCircle2, RotateCcw, MessageSquare, ClipboardCheck } from "lucide-react";

export function ReportesClient({ reportes }: { reportes: ReporteDTO[] }) {
  const [itens, setItens] = useState(reportes);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function alternar(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        const novo = await alternarStatusReporte(id);
        setItens((prev) => prev.map((r) => (r.id === id ? { ...r, status: novo } : r)));
      } finally {
        setPendingId(null);
      }
    });
  }

  if (itens.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <ClipboardCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Nenhum reporte</h2>
          <p className="max-w-sm text-sm text-slate-400">
            Quando alguém reportar uma questão, ela aparece aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {itens.map((r) => {
        const resolvido = r.status === "resolvido";
        return (
          <Card key={r.id} className={cn(resolvido && "opacity-70")}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{r.questao.assunto}</Badge>
                  {r.questao.subassunto && (
                    <Badge variant="neutral">{r.questao.subassunto}</Badge>
                  )}
                  <Badge variant={resolvido ? "success" : "warning"}>
                    {resolvido ? "Resolvido" : "Aberto"}
                  </Badge>
                </div>
                <span className="text-xs text-slate-500">{formatarData(r.criadoEm)}</span>
              </div>

              <p className="text-sm leading-relaxed text-slate-200">{r.questao.enunciado}</p>

              <div className="flex flex-wrap gap-1.5">
                {r.motivos.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-300 ring-1 ring-inset ring-rose-500/30"
                  >
                    <Flag className="h-3 w-3" />
                    {rotuloMotivo(m)}
                  </span>
                ))}
              </div>

              {r.comentario && (
                <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <p className="leading-relaxed">{r.comentario}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-slate-500">
                  Reportado por <span className="text-slate-400">{r.reportadoPor}</span>
                </span>
                <Button
                  size="sm"
                  variant={resolvido ? "ghost" : "secondary"}
                  onClick={() => alternar(r.id)}
                  disabled={pendingId === r.id}
                >
                  {resolvido ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reabrir
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Marcar como resolvido
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
