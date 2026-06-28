"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HistoricoItem } from "@/server/historico";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuracao } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, History } from "lucide-react";

type Resultado = "todas" | "acertos" | "erros";

export function HistoricoCliente({
  itens,
  assuntos,
}: {
  itens: HistoricoItem[];
  assuntos: string[];
}) {
  const router = useRouter();
  const [resultado, setResultado] = useState<Resultado>("todas");
  const [assunto, setAssunto] = useState<string>(""); // "" = todos

  const filtrados = useMemo(
    () =>
      itens.filter((i) => {
        if (resultado === "acertos" && !i.acertou) return false;
        if (resultado === "erros" && i.acertou) return false;
        if (assunto && i.assunto !== assunto) return false;
        return true;
      }),
    [itens, resultado, assunto]
  );

  const total = filtrados.length;
  const acertos = filtrados.filter((i) => i.acertou).length;
  const percentual = total ? Math.round((acertos / total) * 100) : 0;

  // Agrupa por dia (rótulo já formatado em pt-BR).
  const grupos = useMemo(() => agruparPorDia(filtrados), [filtrados]);

  if (itens.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <History className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Nenhuma resposta ainda</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Assim que você resolver questões no treino, elas aparecerão aqui.
            </p>
          </div>
          <Button onClick={() => router.push("/treino")}>Ir para o treino</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo do recorte atual */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
          <span className="text-slate-300">
            <span className="font-semibold text-slate-100">{total}</span> resposta(s)
          </span>
          <span className="text-slate-300">
            <span className="font-semibold text-emerald-300">{acertos}</span> acerto(s)
          </span>
          <span className="text-slate-300">
            Aproveitamento <span className="font-semibold text-indigo-300">{percentual}%</span>
          </span>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <FiltroChip ativo={resultado === "todas"} onClick={() => setResultado("todas")}>
            Todas
          </FiltroChip>
          <FiltroChip ativo={resultado === "acertos"} onClick={() => setResultado("acertos")}>
            Acertos
          </FiltroChip>
          <FiltroChip ativo={resultado === "erros"} onClick={() => setResultado("erros")}>
            Erros
          </FiltroChip>
        </div>
        {assuntos.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <FiltroChip ativo={assunto === ""} onClick={() => setAssunto("")}>
              Todos os temas
            </FiltroChip>
            {assuntos.map((a) => (
              <FiltroChip key={a} ativo={assunto === a} onClick={() => setAssunto(a)}>
                {a}
              </FiltroChip>
            ))}
          </div>
        )}
      </div>

      {/* Lista agrupada por dia */}
      {total === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-400">
            Nenhuma resposta com esses filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <div key={g.dia}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {g.dia}
              </p>
              <div className="space-y-2">
                {g.itens.map((i) => (
                  <ItemHistorico key={i.id} item={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemHistorico({ item }: { item: HistoricoItem }) {
  const Icon = item.acertou ? CheckCircle2 : XCircle;
  return (
    <Card>
      <CardContent className="flex gap-3 p-4">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            item.acertou ? "text-emerald-400" : "text-rose-400"
          )}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{item.assunto}</Badge>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {formatDuracao(item.tempo)} · {horaCurta(item.respondidaEm)}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-slate-300">{item.enunciado}</p>
          <p className="text-xs text-slate-400">
            Sua resposta:{" "}
            <span className={item.acertou ? "text-emerald-300" : "text-rose-300"}>
              {item.respostaTexto}
            </span>
          </p>
          {!item.acertou && item.corretaTexto && (
            <p className="text-xs text-slate-400">
              Correta: <span className="text-emerald-300">{item.corretaTexto}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FiltroChip({
  children,
  ativo,
  onClick,
}: {
  children: React.ReactNode;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-all",
        ativo
          ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
          : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"
      )}
    >
      {children}
    </button>
  );
}

const fmtDia = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const fmtHora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function horaCurta(iso: string) {
  return fmtHora.format(new Date(iso));
}

function rotuloDia(d: Date): string {
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (mesmaData(d, hoje)) return "Hoje";
  if (mesmaData(d, ontem)) return "Ontem";
  return fmtDia.format(d);
}

function mesmaData(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function agruparPorDia(itens: HistoricoItem[]): { dia: string; itens: HistoricoItem[] }[] {
  const grupos: { dia: string; itens: HistoricoItem[] }[] = [];
  let atual: { dia: string; itens: HistoricoItem[] } | null = null;
  for (const i of itens) {
    const rotulo = rotuloDia(new Date(i.respondidaEm));
    if (!atual || atual.dia !== rotulo) {
      atual = { dia: rotulo, itens: [] };
      grupos.push(atual);
    }
    atual.itens.push(i);
  }
  return grupos;
}
