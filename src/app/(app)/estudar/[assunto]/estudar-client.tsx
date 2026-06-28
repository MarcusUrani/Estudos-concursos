"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TreinoSessao } from "@/components/treino-sessao";
import type { LegislacaoDetalhe } from "@/server/legislacao";
import type { QuestaoDTO } from "@/server/treino";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, BookOpenText, Pencil, Layers, ScrollText, Dot } from "lucide-react";

type Aba = "resumo" | "praticar";

export function EstudarClient({
  detalhe,
  relacionadas,
  favoritos,
}: {
  detalhe: LegislacaoDetalhe;
  relacionadas: QuestaoDTO[];
  favoritos: string[];
}) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("resumo");
  const favMap = Object.fromEntries(favoritos.map((id) => [id, true]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/estudar"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas as legislações
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{detalhe.nome}</h1>
            {detalhe.descricao && (
              <p className="mt-1 text-sm text-slate-400">{detalhe.descricao}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">{detalhe.totalQuestoes} questões no banco</p>
          </div>
          <Link href={`/flashcards?assunto=${detalhe.id}`}>
            <Button variant="secondary">
              <Layers className="h-4 w-4" />
              Flashcards
            </Button>
          </Link>
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        <AbaBtn ativo={aba === "resumo"} onClick={() => setAba("resumo")} icon={BookOpenText} label="Resumo" />
        <AbaBtn
          ativo={aba === "praticar"}
          onClick={() => setAba("praticar")}
          icon={Pencil}
          label="Praticar"
        />
      </div>

      {aba === "resumo" ? (
        <div className="space-y-4">
          {detalhe.fontesLegais.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                  <ScrollText className="h-4 w-4" /> Bases legais principais
                </p>
                <div className="flex flex-wrap gap-2">
                  {detalhe.fontesLegais.map((f) => (
                    <Badge key={f} variant="neutral">
                      {f}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {detalhe.secoes.map((s) => (
            <Card key={s.titulo}>
              <CardContent className="space-y-3 p-5">
                <h3 className="font-semibold text-slate-100">{s.titulo}</h3>
                <ul className="space-y-2">
                  {s.pontos.map((p, i) => (
                    <li key={i} className="flex gap-1 text-sm leading-relaxed text-slate-300">
                      <Dot className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                {s.fontes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {s.fontes.map((f) => (
                      <span key={f} className="text-xs text-slate-500">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <p className="px-1 text-xs text-slate-500">
            Resumo gerado automaticamente a partir das explicações das questões deste tema. Use-o
            como guia de estudo e confirme sempre na fonte legal citada.
          </p>
        </div>
      ) : relacionadas.length > 0 ? (
        <TreinoSessao
          questoes={relacionadas}
          favoritosIniciais={favMap}
          acaoFinal={{ label: "Voltar às legislações", onClick: () => router.push("/estudar") }}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-400">
            Ainda não há questões cadastradas para este tema.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AbaBtn({
  ativo,
  onClick,
  icon: Icon,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
        ativo ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
