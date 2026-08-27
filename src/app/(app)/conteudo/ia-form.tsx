"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  gerarQuestoesIA,
  salvarQuestoesGeradas,
  type QuestaoGerada,
  type ResultadoGravacao,
} from "@/server/admin-ia";
import type { ConcursoArvore } from "@/server/conteudo";
import { NIVEIS, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bolha } from "@/components/ui/bolha";
import { Campo, Feedback, inputCls, textareaCls } from "./campos";
import { Sparkles, Save, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";

// Teto de 12 vem da cota por minuto do Groq (8.000 tokens no modelo padrao),
// nao de preferencia — ver `tetoTokens` em server/admin-ia.ts.
const QUANTIDADES = [3, 5, 8, 12];

/** Item da revisao: a questao gerada mais o estado de aprovacao do admin. */
type ItemRevisao = QuestaoGerada & { incluir: boolean };

export function IaForm({ concursos }: { concursos: ConcursoArvore[] }) {
  const router = useRouter();

  const [concursoId, setConcursoId] = useState(concursos[0]?.id ?? "");
  const [materiaId, setMateriaId] = useState("");
  const [assuntoId, setAssuntoId] = useState("");
  const [banca, setBanca] = useState("QUADRIX");
  const [quantidade, setQuantidade] = useState(10);
  const [nivel, setNivel] = useState<string>(""); // "" = misto
  const [instrucoes, setInstrucoes] = useState("");

  const [itens, setItens] = useState<ItemRevisao[] | null>(null);
  const [modelo, setModelo] = useState<string | null>(null);
  const [descartadas, setDescartadas] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [gravacao, setGravacao] = useState<ResultadoGravacao | null>(null);

  const [gerando, startGerar] = useTransition();
  const [salvando, startSalvar] = useTransition();

  const concurso = concursos.find((c) => c.id === concursoId);
  const materias = concurso?.materias ?? [];
  const assuntos = useMemo(
    () => (concurso?.assuntos ?? []).filter((a) => !materiaId || a.materiaId === materiaId),
    [concurso, materiaId]
  );

  const aprovadas = itens?.filter((i) => i.incluir) ?? [];

  function trocarConcurso(id: string) {
    setConcursoId(id);
    setMateriaId("");
    setAssuntoId("");
    limparResultado();
  }

  function trocarMateria(id: string) {
    setMateriaId(id);
    setAssuntoId("");
    limparResultado();
  }

  function limparResultado() {
    setItens(null);
    setModelo(null);
    setDescartadas([]);
    setGravacao(null);
    setErro(null);
  }

  function gerar() {
    setErro(null);
    setGravacao(null);
    startGerar(async () => {
      try {
        const r = await gerarQuestoesIA({
          concursoId,
          assuntoId,
          banca,
          quantidade,
          nivel: nivel || null,
          instrucoes,
        });
        if (!r.ok) {
          setItens(null);
          setErro(r.erro);
          return;
        }
        setItens(r.dados.questoes.map((q) => ({ ...q, incluir: true })));
        setDescartadas(r.dados.descartadas);
        setModelo(r.dados.modelo);
      } catch (e) {
        setItens(null);
        setErro(e instanceof Error ? e.message : "Não foi possível gerar as questões.");
      }
    });
  }

  function salvar() {
    setErro(null);
    startSalvar(async () => {
      try {
        const r = await salvarQuestoesGeradas({
          concursoId,
          assuntoId,
          banca,
          // Monta o payload campo a campo: `incluir` e estado de tela e nao
          // pode vazar para a action.
          questoes: aprovadas.map((it) => ({
            enunciado: it.enunciado,
            nivel: it.nivel,
            dificuldade: it.dificuldade,
            explicacao: it.explicacao,
            fonte: it.fonte,
            palavrasChave: it.palavrasChave,
            subassunto: it.subassunto,
            alternativas: it.alternativas,
          })),
        });
        if (!r.ok) {
          setErro(r.erro);
          return;
        }
        setGravacao(r.dados);
        setItens(null);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar as questões.");
      }
    });
  }

  if (concursos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-400">
          Nenhum concurso cadastrado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="rounded-sm border border-slate-800 bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-400">
            As questões são geradas pelo <span className="font-medium text-slate-200">Groq</span> e{" "}
            <span className="font-medium text-slate-200">não são salvas automaticamente</span>: elas
            aparecem abaixo para você revisar e escolher quais entram no banco. O gabarito começa{" "}
            <span className="font-medium text-slate-200">recolhido</span>: julgue primeiro se o
            enunciado se sustenta sozinho e se as alternativas são plausíveis, depois abra e confira a
            resposta. Enunciados repetidos, e questões que mandam ler um texto que não está ali, são
            descartados sozinhos. No plano gratuito do Groq há um limite por minuto: espere cerca de
            um minuto entre duas gerações de 12.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Concurso">
              <select
                value={concursoId}
                onChange={(e) => trocarConcurso(e.target.value)}
                className={inputCls}
              >
                {concursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Matéria">
              <select
                value={materiaId}
                onChange={(e) => trocarMateria(e.target.value)}
                className={inputCls}
              >
                <option value="">Todas as matérias</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Assunto">
            <select
              value={assuntoId}
              onChange={(e) => {
                setAssuntoId(e.target.value);
                limparResultado();
              }}
              className={inputCls}
            >
              <option value="">Selecione…</option>
              {assuntos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Banca">
              <Input
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                placeholder="Ex.: QUADRIX"
              />
            </Campo>

            <Campo label="Quantidade">
              <div className="flex flex-wrap gap-2">
                {QUANTIDADES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantidade(q)}
                    className={cn(
                      "tabular rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      quantidade === q
                        ? "border-indigo-500 bg-indigo-600/15 text-indigo-200"
                        : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </Campo>
          </div>

          <Campo label="Nível">
            <div className="flex flex-wrap gap-2">
              {[{ v: "", l: "Misto" }, ...NIVEIS.map((n) => ({ v: n, l: n }))].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setNivel(o.v)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    nivel === o.v
                      ? "border-indigo-500 bg-indigo-600/15 text-indigo-200"
                      : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </Campo>

          <Campo label="Instruções adicionais (opcional)">
            <textarea
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
              rows={2}
              className={textareaCls}
              placeholder="Ex.: foque nos artigos 5º a 12; cobre prazos e competências."
            />
          </Campo>

          <Feedback erro={erro} />

          {gravacao && (
            <div className="space-y-2 rounded-sm border border-slate-800 bg-slate-950/40 p-3 text-sm">
              <p className="text-emerald-300">
                {gravacao.criadas} {gravacao.criadas === 1 ? "questão salva" : "questões salvas"}
                {gravacao.ignoradas > 0 && (
                  <span className="text-slate-400"> · {gravacao.ignoradas} ignorada(s) (duplicadas)</span>
                )}
              </p>
              {gravacao.erros.length > 0 && (
                <ul className="list-inside list-disc space-y-0.5 text-xs text-rose-300">
                  {gravacao.erros.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={gerar} disabled={gerando || !assuntoId}>
              <Sparkles className="h-4 w-4" />
              {gerando ? "Gerando…" : `Gerar ${quantidade} questões`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {itens && (
        <Revisao
          itens={itens}
          setItens={setItens}
          modelo={modelo}
          descartadas={descartadas}
          aprovadas={aprovadas.length}
          salvando={salvando}
          onSalvar={salvar}
          onDescartar={limparResultado}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- revisão

function Revisao({
  itens,
  setItens,
  modelo,
  descartadas,
  aprovadas,
  salvando,
  onSalvar,
  onDescartar,
}: {
  itens: ItemRevisao[];
  setItens: React.Dispatch<React.SetStateAction<ItemRevisao[] | null>>;
  modelo: string | null;
  descartadas: string[];
  aprovadas: number;
  salvando: boolean;
  onSalvar: () => void;
  onDescartar: () => void;
}) {
  // Gabarito recolhido por padrao — para julgar melhor, nao para esconder.
  //
  // Com a alternativa correta ja marcada, o olho concorda com ela: as outras
  // quatro passam a parecer obviamente erradas mesmo quando sao fracas ou
  // ambiguas. Lendo primeiro sem gabarito da para ver se o enunciado se sustenta
  // sozinho e se as alternativas sao mesmo plausiveis. Depois e so abrir e
  // conferir a resposta.
  const [revelados, setRevelados] = useState<Set<number>>(new Set());

  function alternar(i: number) {
    setItens((prev) =>
      prev ? prev.map((it, idx) => (idx === i ? { ...it, incluir: !it.incluir } : it)) : prev
    );
  }

  function revelar(i: number) {
    setRevelados((prev) => {
      const nova = new Set(prev);
      if (nova.has(i)) nova.delete(i);
      else nova.add(i);
      return nova;
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <p className="font-display text-base font-semibold text-slate-100">
              Revisão — {itens.length} {itens.length === 1 ? "questão gerada" : "questões geradas"}
            </p>
            {modelo && <p className="etiqueta mt-1">Modelo {modelo}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onDescartar} disabled={salvando}>
              <RotateCcw className="h-4 w-4" />
              Descartar tudo
            </Button>
            <Button onClick={onSalvar} disabled={salvando || aprovadas === 0}>
              <Save className="h-4 w-4" />
              {salvando ? "Salvando…" : `Salvar ${aprovadas}`}
            </Button>
          </div>
        </div>

        {descartadas.length > 0 && (
          <details className="rounded-sm border border-amber-700/40 bg-amber-500/5 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-amber-300">
              {descartadas.length} {descartadas.length === 1 ? "item descartado" : "itens descartados"} na
              validação
            </summary>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-slate-400">
              {descartadas.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="space-y-3">
          {itens.map((q, i) => (
            <div
              key={i}
              className={cn(
                "rounded-sm border p-4 transition-colors",
                q.incluir
                  ? "border-slate-700 bg-slate-950/40"
                  : "border-slate-800 bg-slate-950/20 opacity-50"
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{q.nivel}</Badge>
                <Badge variant="neutral">dificuldade {q.dificuldade}</Badge>
                {q.subassunto && <Badge>{q.subassunto}</Badge>}
                <button
                  type="button"
                  onClick={() => alternar(i)}
                  className={cn(
                    "ml-auto flex items-center gap-1.5 text-xs font-medium transition-colors",
                    q.incluir ? "text-slate-400 hover:text-rose-300" : "text-emerald-300"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {q.incluir ? "Descartar" : "Recuperar"}
                </button>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-line text-slate-100">
                {q.enunciado}
              </p>

              {(() => {
                const aberto = revelados.has(i);
                return (
                  <>
                    <ul className="mt-3 space-y-1.5">
                      {q.alternativas.map((a, idx) => (
                        <li
                          key={idx}
                          className={cn(
                            "flex items-start gap-2.5 text-sm",
                            aberto && a.correta ? "text-emerald-200" : "text-slate-400"
                          )}
                        >
                          {/* Fechado: todas as bolhas vazias. Nenhum contraste,
                              nenhuma cor — nada que denuncie a correta. */}
                          <Bolha
                            tamanho="md"
                            estado={aberto && a.correta ? "certa" : "vazia"}
                            className={cn(
                              "mt-0.5 text-[0.625rem]",
                              aberto && a.correta ? "text-white" : "text-slate-500"
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </Bolha>
                          <span>{a.texto}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 border-t border-slate-800 pt-3">
                      {aberto ? (
                        <div className="space-y-1 text-xs leading-relaxed text-slate-400">
                          <p>
                            <span className="font-medium text-slate-300">Comentário: </span>
                            {q.explicacao}
                          </p>
                          {q.fonte && (
                            <p>
                              <span className="font-medium text-slate-300">Fonte: </span>
                              {q.fonte}
                            </p>
                          )}
                          {q.palavrasChave.length > 0 && (
                            <p className="text-slate-500">{q.palavrasChave.join(" · ")}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Gabarito, comentário e fonte recolhidos.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => revelar(i)}
                        aria-expanded={aberto}
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-indigo-300"
                      >
                        {aberto ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Ocultar gabarito
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Ver gabarito
                          </>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
