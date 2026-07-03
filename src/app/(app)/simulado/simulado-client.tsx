"use client";

import { useState, useTransition } from "react";
import { montarTreino, type QuestaoDTO } from "@/server/treino";
import {
  finalizarSimulado,
  type RespostaSimulado,
  type ResultadoSimulado,
  type SimuladoResumo,
} from "@/server/simulado";
import { SimuladoSessao } from "@/components/simulado-sessao";
import { SeletorAssuntos, type AssuntoSel } from "@/components/seletor-assuntos";
import { SeletorQuantidade } from "@/components/seletor-quantidade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatDuracao } from "@/lib/utils";
import {
  TimerReset,
  ArrowRight,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BookOpen,
  ScrollText,
  History,
} from "lucide-react";

type Assunto = AssuntoSel;

const NIVEIS = [
  { value: "", label: "Todos os níveis" },
  { value: "Facil", label: "Fácil" },
  { value: "Medio", label: "Médio" },
  { value: "Dificil", label: "Difícil" },
];
const TEMPOS = [10, 20, 30, 60]; // minutos

type Fase = "config" | "rodando" | "resultado";

export function SimuladoClient({
  assuntos,
  historico,
}: {
  assuntos: Assunto[];
  historico: SimuladoResumo[];
}) {
  const [fase, setFase] = useState<Fase>("config");
  const [questoes, setQuestoes] = useState<QuestaoDTO[]>([]);
  const [duracao, setDuracao] = useState(0); // segundos
  const [resultado, setResultado] = useState<ResultadoSimulado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // filtros
  const [assuntoIds, setAssuntoIds] = useState<string[]>([]);
  const [nivel, setNivel] = useState("");
  const [quantidade, setQuantidade] = useState(20);
  const [minutos, setMinutos] = useState(30);

  function toggleAssunto(id: string) {
    setAssuntoIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function iniciar() {
    setErro(null);
    startTransition(async () => {
      try {
        const lista = await montarTreino({
          assuntoIds: assuntoIds.length ? assuntoIds : undefined,
          nivel: nivel || undefined,
          status: "todas",
          quantidade,
        });
        if (lista.length === 0) {
          setErro("Nenhuma questão encontrada com esses filtros. Tente afrouxá-los.");
          return;
        }
        setQuestoes(lista);
        setDuracao(minutos * 60);
        setFase("rodando");
      } catch {
        setErro("Não foi possível montar o simulado. Tente novamente.");
      }
    });
  }

  function finalizar(respostas: RespostaSimulado[], tempoGasto: number) {
    startTransition(async () => {
      const r = await finalizarSimulado(respostas, tempoGasto, duracao);
      setResultado(r);
      setFase("resultado");
    });
  }

  function reiniciar() {
    setResultado(null);
    setQuestoes([]);
    setFase("config");
  }

  if (fase === "rodando") {
    return (
      <SimuladoSessao
        questoes={questoes}
        duracaoSegundos={duracao}
        onFinalizar={finalizar}
        pending={pending}
      />
    );
  }

  if (fase === "resultado" && resultado) {
    return <ResultadoView resultado={resultado} onNovo={reiniciar} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TimerReset className="h-5 w-5 text-indigo-400" />
            Montar simulado
          </CardTitle>
          <p className="text-sm text-slate-400">
            Resolva sob o relógio, sem correção na hora. O gabarito aparece só no final.
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

          <Campo titulo="Quantidade de questões">
            <SeletorQuantidade value={quantidade} onChange={setQuantidade} />
          </Campo>

          <Campo titulo="Tempo" dica={`${(minutos / quantidade).toFixed(1)} min por questão`}>
            <div className="flex flex-wrap gap-2">
              {TEMPOS.map((m) => (
                <Chip key={m} ativo={minutos === m} onClick={() => setMinutos(m)}>
                  {m} min
                </Chip>
              ))}
            </div>
          </Campo>

          {erro && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              {erro}
            </p>
          )}

          <Button size="lg" className="w-full" onClick={iniciar} disabled={pending}>
            {pending ? "Montando..." : "Iniciar simulado"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-slate-400" />
              Simulados anteriores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {historico.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      s.percentual >= 80
                        ? "text-emerald-300"
                        : s.percentual >= 60
                        ? "text-indigo-300"
                        : "text-rose-300"
                    )}
                  >
                    {s.percentual}%
                  </span>
                  <span className="text-slate-400">
                    {s.acertos}/{s.total} · {formatDuracao(s.tempo)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{dataCurta(s.finalizadoEm)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultadoView({
  resultado,
  onNovo,
}: {
  resultado: ResultadoSimulado;
  onNovo: () => void;
}) {
  const { percentual, acertos, total, tempo, itens, porAssunto } = resultado;
  const semResposta = itens.filter((i) => !i.escolhidaId).length;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Simulado concluído!</h2>
            <p className="mt-1 text-slate-400">
              Você acertou{" "}
              <span className="font-semibold text-emerald-400">
                {acertos} de {total}
              </span>{" "}
              ({percentual}%) em {formatDuracao(tempo)}.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Progress
              value={percentual}
              barClassName={
                percentual >= 80 ? "bg-emerald-500" : percentual >= 60 ? "bg-indigo-500" : "bg-rose-500"
              }
            />
          </div>
          {semResposta > 0 && (
            <p className="text-xs text-slate-500">
              {semResposta} questão(ões) sem resposta contaram como erro.
            </p>
          )}
          <Button onClick={onNovo} className="mt-2">
            <RotateCcw className="h-4 w-4" />
            Novo simulado
          </Button>
        </CardContent>
      </Card>

      {porAssunto.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho por tema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {porAssunto.map((a) => (
              <div key={a.assunto}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{a.assunto}</span>
                  <span className="font-medium text-slate-400">
                    {a.percentual}%{" "}
                    <span className="text-slate-600">
                      ({a.acertos}/{a.total})
                    </span>
                  </span>
                </div>
                <Progress
                  value={a.percentual}
                  barClassName={
                    a.percentual >= 80 ? "bg-emerald-500" : a.percentual >= 60 ? "bg-indigo-500" : "bg-rose-500"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Gabarito comentado
        </h3>
        <div className="space-y-3">
          {itens.map((item, idx) => (
            <ItemRevisao key={item.questaoId} item={item} numero={idx + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ItemRevisao({
  item,
  numero,
}: {
  item: ResultadoSimulado["itens"][number];
  numero: number;
}) {
  const Icon = !item.escolhidaId ? MinusCircle : item.acertou ? CheckCircle2 : XCircle;
  const cor = !item.escolhidaId
    ? "text-slate-400"
    : item.acertou
    ? "text-emerald-400"
    : "text-rose-400";

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5 shrink-0", cor)} />
          <span className="text-sm font-medium text-slate-400">Questão {numero}</span>
          <Badge variant="neutral">{item.assunto}</Badge>
        </div>

        <p className="text-base leading-relaxed text-slate-100">{item.enunciado}</p>

        <div className="space-y-2">
          {item.alternativas.map((alt, i) => {
            const escolhida = item.escolhidaId === alt.id;
            const erradaEscolhida = escolhida && !alt.correta;
            return (
              <div
                key={alt.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
                  alt.correta
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                    : erradaEscolhida
                    ? "border-rose-500 bg-rose-500/10 text-rose-100"
                    : "border-slate-800 bg-slate-950/40 text-slate-400"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                    alt.correta
                      ? "bg-emerald-500 text-white"
                      : erradaEscolhida
                      ? "bg-rose-500 text-white"
                      : "bg-slate-800 text-slate-500"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 pt-0.5">{alt.texto}</span>
                {alt.correta && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {erradaEscolhida && <XCircle className="h-5 w-5 text-rose-400" />}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            <BookOpen className="h-4 w-4" /> Comentário
          </p>
          <p className="text-sm leading-relaxed text-slate-300">{item.explicacao}</p>
          {item.fonteLegal && (
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
              <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>
                <span className="font-medium text-slate-300">Base legal: </span>
                {item.fonteLegal}
              </span>
            </p>
          )}
        </div>
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

const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
function dataCurta(iso: string) {
  return fmtData.format(new Date(iso));
}
