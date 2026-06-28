"use client";

import { useRouter } from "next/navigation";
import { TreinoSessao } from "@/components/treino-sessao";
import type { QuestaoDTO } from "@/server/treino";
import type { QuestaoRevisaoDTO } from "@/server/revisao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck2 } from "lucide-react";

export function RevisaoDoDiaCliente({
  questoes,
  favoritos,
}: {
  questoes: QuestaoRevisaoDTO[];
  favoritos: string[];
}) {
  const router = useRouter();

  if (questoes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <CalendarCheck2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Tudo em dia! 🎉</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Nenhuma revisão vencida por enquanto. Continue resolvendo questões — quando você
              errar (ou acertar) algo, ele entra na fila e volta aqui no momento certo.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.push("/treino")}>Ir para o treino</Button>
            <Button variant="secondary" onClick={() => router.push("/flashcards")}>
              Revisar com flashcards
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const favMap = Object.fromEntries(favoritos.map((id) => [id, true]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        <span className="font-semibold text-amber-300">{questoes.length}</span>{" "}
        {questoes.length === 1 ? "questão vencida" : "questões vencidas"} para revisar hoje.
      </p>
      <TreinoSessao
        questoes={questoes.map(paraQuestaoDTO)}
        favoritosIniciais={favMap}
        acaoFinal={{ label: "Voltar ao dashboard", onClick: () => router.push("/dashboard") }}
      />
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
