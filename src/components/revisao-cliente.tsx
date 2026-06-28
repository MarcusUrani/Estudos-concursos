"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TreinoSessao } from "@/components/treino-sessao";
import { RevisaoVisualizar } from "@/components/revisao-visualizar";
import type { QuestaoDTO } from "@/server/treino";
import type { QuestaoRevisaoDTO } from "@/server/revisao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star, XCircle, Eye, Pencil } from "lucide-react";

type Modo = "visualizar" | "responder";

export function RevisaoCliente({
  questoes,
  favoritos,
  tipo,
}: {
  questoes: QuestaoRevisaoDTO[];
  favoritos: string[];
  tipo: "favoritas" | "erradas";
}) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("responder");

  if (questoes.length === 0) {
    const Icon = tipo === "favoritas" ? Star : XCircle;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {tipo === "favoritas" ? "Nenhuma favorita ainda" : "Nenhuma questão errada"}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              {tipo === "favoritas"
                ? "Toque na estrela ⭐ de uma questão durante o treino para salvá-la aqui."
                : "As questões que você errar aparecerão aqui para revisão. Bom trabalho!"}
            </p>
          </div>
          <Button onClick={() => router.push("/treino")}>Ir para o treino</Button>
        </CardContent>
      </Card>
    );
  }

  const favMap = Object.fromEntries(favoritos.map((id) => [id, true]));

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        <ModoBtn
          ativo={modo === "visualizar"}
          onClick={() => setModo("visualizar")}
          icon={Eye}
          label="Visualizar"
        />
        <ModoBtn
          ativo={modo === "responder"}
          onClick={() => setModo("responder")}
          icon={Pencil}
          label="Responder"
        />
      </div>

      {modo === "visualizar" ? (
        <RevisaoVisualizar questoes={questoes} favoritosIniciais={favMap} />
      ) : (
        <TreinoSessao
          key="responder"
          questoes={questoes.map(paraQuestaoDTO)}
          favoritosIniciais={favMap}
          acaoFinal={{ label: "Voltar ao dashboard", onClick: () => router.push("/dashboard") }}
        />
      )}
    </div>
  );
}

function paraQuestaoDTO(q: QuestaoRevisaoDTO): QuestaoDTO {
  return {
    id: q.id,
    enunciado: q.enunciado,
    nivel: q.nivel,
    banca: q.banca,
    assunto: q.assunto,
    subassunto: q.subassunto,
    alternativas: q.alternativas.map((a) => ({ id: a.id, texto: a.texto, ordem: a.ordem })),
  };
}

function ModoBtn({
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
        ativo
          ? "bg-indigo-600 text-white shadow"
          : "text-slate-400 hover:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
