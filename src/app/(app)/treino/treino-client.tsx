"use client";

import { useState, useTransition } from "react";
import {
  montarTreino,
  type FiltroTreino,
  type QuestaoDTO,
} from "@/server/treino";
import { TreinoSessao } from "@/components/treino-sessao";
import { SeletorAssuntos, type AssuntoSel } from "@/components/seletor-assuntos";
import { SeletorQuantidade } from "@/components/seletor-quantidade";
import { salvarSessao, limparSessao, type SessaoSalva } from "@/server/sessao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dumbbell, ArrowRight } from "lucide-react";

type Assunto = AssuntoSel;

const NIVEIS = [
  { value: "", label: "Todos os níveis" },
  { value: "Facil", label: "Fácil" },
  { value: "Medio", label: "Médio" },
  { value: "Dificil", label: "Difícil" },
];

const STATUS: { value: NonNullable<FiltroTreino["status"]>; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "nunca", label: "Nunca respondidas" },
  { value: "erradas", label: "Que errei" },
  { value: "favoritas", label: "Favoritas" },
];


type EstadoTreino = { questoes: QuestaoDTO[]; indice: number; acertos: number };
const TIPO = "treino";

export function TreinoClient({
  assuntos,
  sessaoInicial,
}: {
  assuntos: Assunto[];
  sessaoInicial?: SessaoSalva | null;
}) {
  const [sessao, setSessao] = useState<EstadoTreino | null>(() =>
    sessaoInicial ? (JSON.parse(sessaoInicial.estado) as EstadoTreino) : null
  );
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  // filtros — temas agora sao multi-selecao (array de ids)
  const [assuntoIds, setAssuntoIds] = useState<string[]>([]);
  const [nivel, setNivel] = useState("");
  const [status, setStatus] = useState<NonNullable<FiltroTreino["status"]>>("todas");
  const [quantidade, setQuantidade] = useState(10);

  function toggleAssunto(id: string) {
    setAssuntoIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }

  function iniciar() {
    setErro(null);
    startTransition(async () => {
      try {
        const lista = await montarTreino({
          assuntoIds: assuntoIds.length ? assuntoIds : undefined,
          nivel: nivel || undefined,
          status,
          quantidade,
        });
        if (lista.length === 0) {
          setErro("Nenhuma questão encontrada com esses filtros. Tente afrouxá-los.");
          return;
        }
        const novo: EstadoTreino = { questoes: lista, indice: 0, acertos: 0 };
        // Salva a sessao (substitui qualquer treino incompleto anterior).
        await salvarSessao({
          tipo: TIPO,
          estado: JSON.stringify(novo),
          indice: 0,
          total: lista.length,
        });
        setSessao(novo);
      } catch {
        setErro("Não foi possível montar o treino. Tente novamente.");
      }
    });
  }

  if (sessao) {
    const { questoes, indice, acertos } = sessao;
    return (
      <TreinoSessao
        questoes={questoes}
        indiceInicial={indice}
        acertosIniciais={acertos}
        onProgresso={(i, ac) =>
          void salvarSessao({
            tipo: TIPO,
            estado: JSON.stringify({ questoes, indice: i, acertos: ac }),
            indice: i,
            total: questoes.length,
          })
        }
        onConcluir={() => void limparSessao(TIPO)}
        acaoFinal={{ label: "Novo treino", onClick: () => setSessao(null) }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-indigo-400" />
          Montar treino
        </CardTitle>
        <p className="text-sm text-slate-400">
          Escolha os filtros e resolva questões com correção imediata.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Campo titulo="Temas">
          <SeletorAssuntos
            assuntos={assuntos}
            selecionados={assuntoIds}
            onAlternar={toggleAssunto}
            onLimpar={() => setAssuntoIds([])}
            desabilitarVazios
            mostrarTotal
          />
        </Campo>

        <Campo titulo="Nível">
          <div className="flex flex-wrap gap-2">
            {NIVEIS.map((n) => (
              <Chip key={n.value} ativo={nivel === n.value} onClick={() => setNivel(n.value)}>
                {n.label}
              </Chip>
            ))}
          </div>
        </Campo>

        <Campo titulo="Situação">
          <div className="flex flex-wrap gap-2">
            {STATUS.map((s) => (
              <Chip key={s.value} ativo={status === s.value} onClick={() => setStatus(s.value)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </Campo>

        <Campo titulo="Quantidade de questões">
          <SeletorQuantidade value={quantidade} onChange={setQuantidade} />
        </Campo>

        {erro && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {erro}
          </p>
        )}

        <Button size="lg" className="w-full" onClick={iniciar} disabled={pending}>
          {pending ? "Montando..." : "Começar treino"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function Campo({
  titulo,
  dica,
  children,
}: {
  titulo: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-300">{titulo}</p>
        {dica && <span className="text-xs text-slate-500">{dica}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({
  children,
  ativo,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  ativo: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40",
        ativo
          ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
          : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"
      )}
    >
      {children}
    </button>
  );
}
