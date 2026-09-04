"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Wrench,
  AlertTriangle,
  BellOff,
  type LucideIcon,
} from "lucide-react";
import { marcarComoLidas, type NotificacaoDTO } from "@/server/notificacoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tipoDe } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

const ICONES: Record<string, LucideIcon> = {
  Sparkles,
  RefreshCw,
  Wrench,
  AlertTriangle,
};

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificacoesClient({ notificacoes }: { notificacoes: NotificacaoDTO[] }) {
  const router = useRouter();
  // Os ids que estavam NAO LIDOS quando a tela montou, congelados na montagem:
  // a marca "Nova" precisa sobreviver a esta visita inteira, senao o refresh
  // que zera o sininho apaga o destaque antes de a pessoa achar o que mudou.
  const [novos] = useState(() => notificacoes.filter((n) => !n.lida).map((n) => n.id));
  const jaMarcou = useRef(false);

  useEffect(() => {
    if (jaMarcou.current || novos.length === 0) return;
    jaMarcou.current = true;
    // Abrir a tela e ler: nao ha botao de "marcar como lida" porque nao ha o que
    // fazer com o aviso alem de le-lo. O refresh zera o contador do sininho.
    marcarComoLidas(novos).then(() => router.refresh());
  }, [router, novos]);

  if (notificacoes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <BellOff className="h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-400">
            Nenhuma notificação por aqui. Quando houver novidade, atualização ou manutenção, o aviso
            aparece nesta tela.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {notificacoes.map((n) => {
        const tipo = tipoDe(n.tipo);
        const Icone = ICONES[tipo.icone] ?? Sparkles;
        const nova = novos.includes(n.id);

        return (
          <Card
            key={n.id}
            className={cn("min-w-0", nova && "border-indigo-600/50 bg-indigo-600/[0.04]")}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border",
                    "border-slate-800 bg-slate-950/40 text-slate-400"
                  )}
                >
                  <Icone className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  {/* Etiquetas antes do titulo: tipo e alcance sao o que dizem
                      se o aviso e para voce, e isso vem antes do assunto. */}
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant={tipo.variante}>{tipo.rotulo}</Badge>
                    {n.concurso && <Badge variant="neutral">{n.concurso}</Badge>}
                    {nova && <Badge variant="success">Nova</Badge>}
                    <span className="tabular ml-auto shrink-0 text-xs text-slate-500">
                      {fmtData.format(new Date(n.criadaEm))}
                    </span>
                  </div>

                  <p className="font-display text-base font-semibold wrap-break-word text-slate-100">
                    {n.titulo}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line wrap-break-word text-slate-300">
                    {n.corpo}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
