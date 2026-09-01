"use client";

import { useMemo, useState, useTransition } from "react";
import {
  gerarTemaRedacao,
  listarTemasRedacao,
  enviarRedacao,
  corrigirRedacaoExterna,
  type TemaDTO,
  type RedacaoDTO,
} from "@/server/redacao";
import type { ConcursoDTO } from "@/server/concurso";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PaginaLeitura, TrilhoBloco, TrilhoDado } from "@/components/ui/pagina";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  PenLine,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Send,
  History,
  FileText,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

const inputCls =
  "w-full rounded-sm border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

// Extensao e escala vem do edital da SEDES-DF (itens 13.1 e 13.3.4).
const LINHAS_MIN = 20;
const LINHAS_MAX = 30;
const CARACTERES_POR_LINHA = 70;
const NOTA_MAX = 100;
const NOTA_MAX_CRITERIO = 3;

/** Mesma estimativa do servidor: paragrafo sempre termina a linha em que esta. */
function estimarLinhas(texto: string): number {
  return texto
    .split(new RegExp(String.fromCharCode(10) + "+"))
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce((total, p) => total + Math.max(1, Math.ceil(p.length / CARACTERES_POR_LINHA)), 0);
}

const fmtNota = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtPeso = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

type Vista = "temas" | "escrever" | "resultado" | "historico" | "externa";

/** As tres telas de entrada. `escrever` e `resultado` sao passos, nao abas. */
type Aba = "temas" | "externa" | "historico";

const ABAS: { id: Aba; rotulo: string; icone: LucideIcon }[] = [
  { id: "temas", rotulo: "Propostas", icone: Sparkles },
  { id: "externa", rotulo: "Corrigir meu texto", icone: ClipboardCheck },
  { id: "historico", rotulo: "Minhas redações", icone: History },
];

function Abas({
  atual,
  onTrocar,
  quantasRedacoes,
}: {
  atual: Vista;
  onTrocar: (a: Aba) => void;
  quantasRedacoes: number;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-slate-800">
      {ABAS.map((a) => {
        const ativa = a.id === atual;
        return (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={ativa}
            onClick={() => onTrocar(a.id)}
            className={cn(
              // -mb-px encosta a borda da aba ativa exatamente na borda do
              // contêiner, senão sobram dois traços paralelos.
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors",
              ativa
                ? "border-indigo-600 font-medium text-slate-100"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <a.icone className="h-4 w-4" />
            {a.rotulo}
            {a.id === "historico" && quantasRedacoes > 0 && (
              <span className="tabular text-xs text-slate-500">({quantasRedacoes})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function RedacaoClient({
  concursos,
  concursoInicial,
  temasIniciais,
  redacoesIniciais,
}: {
  concursos: ConcursoDTO[];
  concursoInicial: string | null;
  temasIniciais: TemaDTO[];
  redacoesIniciais: RedacaoDTO[];
}) {
  const [concursoId, setConcursoId] = useState(concursoInicial ?? "");
  const [temas, setTemas] = useState(temasIniciais);
  const [redacoes, setRedacoes] = useState(redacoesIniciais);

  const [vista, setVista] = useState<Vista>("temas");
  // De qual aba a pessoa saiu para ver um resultado — e para la que o botao
  // "voltar" da correcao devolve.
  const [origem, setOrigem] = useState<Aba>("temas");
  const [temaAtivo, setTemaAtivo] = useState<TemaDTO | null>(null);
  const [resultado, setResultado] = useState<RedacaoDTO | null>(null);

  const [banca, setBanca] = useState("");
  const [orientacao, setOrientacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, startGerar] = useTransition();
  const [trocando, startTrocar] = useTransition();

  function trocarConcurso(id: string) {
    setConcursoId(id);
    setErro(null);
    startTrocar(async () => {
      try {
        setTemas(await listarTemasRedacao(id));
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível carregar os temas.");
      }
    });
  }

  function gerar() {
    setErro(null);
    startGerar(async () => {
      try {
        const r = await gerarTemaRedacao({ concursoId, banca, orientacao });
        if (!r.ok) {
          setErro(r.erro);
          return;
        }
        setTemas((prev) => [r.dados, ...prev]);
        setTemaAtivo(r.dados);
        setVista("escrever");
        setOrientacao("");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível gerar o tema.");
      }
    });
  }

  if (vista === "escrever" && temaAtivo) {
    return (
      <Escrever
        tema={temaAtivo}
        onVoltar={() => setVista("temas")}
        onCorrigida={(r) => {
          setRedacoes((prev) => [r, ...prev]);
          setTemas((prev) =>
            prev.map((t) => (t.id === r.temaId ? { ...t, minhasRedacoes: t.minhasRedacoes + 1 } : t))
          );
          setOrigem("temas");
          setResultado(r);
          setVista("resultado");
        }}
      />
    );
  }

  if (vista === "resultado" && resultado) {
    return (
      <Resultado
        redacao={resultado}
        onVoltar={() => {
          setResultado(null);
          setVista(origem);
        }}
      />
    );
  }

  const abas = (
    <Abas
      atual={vista}
      onTrocar={(a) => {
        setErro(null);
        setVista(a);
      }}
      quantasRedacoes={redacoes.length}
    />
  );

  if (vista === "historico") {
    return (
      <div className="space-y-5">
        {abas}
        <Historico
          redacoes={redacoes}
          onAbrir={(r) => {
            setOrigem("historico");
            setResultado(r);
            setVista("resultado");
          }}
        />
      </div>
    );
  }

  if (vista === "externa") {
    return (
      <div className="space-y-5">
        {abas}
        <CorrigirExterna
          concursos={concursos}
          concursoId={concursoId}
          onConcurso={trocarConcurso}
          onCorrigida={(r) => {
            setRedacoes((prev) => [r, ...prev]);
            setOrigem("externa");
            setResultado(r);
            setVista("resultado");
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {abas}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Nova proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="rounded-sm border border-slate-800 bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-400">
            A proposta vem com <span className="font-medium text-slate-200">textos de apoio
            reais</span>, buscados na web. Cada citação é aberta e conferida contra a página de
            origem: o que não confere é descartado, e uma proposta sem nenhuma fonte confirmada não
            é salva. Ainda assim, leia a fonte antes de usar o dado numa prova — a conferência
            garante que o trecho está lá, não que a fonte seja boa.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-300">Concurso</p>
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
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-300">Banca (opcional)</p>
              <Input
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                placeholder="Ex.: QUADRIX"
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">
              Orientação para o tema (opcional)
            </p>
            <textarea
              value={orientacao}
              onChange={(e) => setOrientacao(e.target.value)}
              rows={2}
              className={cn(inputCls, "resize-y")}
              placeholder="Ex.: algo ligado a população em situação de rua no DF."
            />
          </div>

          {erro && (
            <p className="rounded-sm bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{erro}</p>
          )}

          <div className="flex justify-end">
            <Button onClick={gerar} disabled={gerando || !concursoId}>
              <Sparkles className="h-4 w-4" />
              {gerando ? "Buscando fontes…" : "Gerar proposta"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="etiqueta mb-3 border-b border-slate-800 pb-2">
          {trocando ? "Carregando…" : `Propostas deste concurso (${temas.length})`}
        </p>

        {temas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-slate-400">
              Nenhuma proposta ainda. Gere a primeira acima.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {temas.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTemaAtivo(t);
                  setVista("escrever");
                }}
                className="min-w-0 rounded-sm border border-slate-800 bg-slate-900 p-4 text-left transition-colors hover:border-indigo-600/50"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {t.banca && <Badge variant="neutral">{t.banca}</Badge>}
                  <Badge variant="neutral">
                    {t.textos.length} {t.textos.length === 1 ? "texto" : "textos"}
                  </Badge>
                  {t.minhasRedacoes > 0 && (
                    <Badge variant="success">
                      {t.minhasRedacoes} {t.minhasRedacoes === 1 ? "envio" : "envios"}
                    </Badge>
                  )}
                  <span className="etiqueta ml-auto">{fmtData.format(new Date(t.criadoEm))}</span>
                </div>
                <p className="text-sm font-semibold text-slate-100">{t.tema}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {t.comando}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- escrever

function Escrever({
  tema,
  onVoltar,
  onCorrigida,
}: {
  tema: TemaDTO;
  onVoltar: () => void;
  onCorrigida: (r: RedacaoDTO) => void;
}) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, start] = useTransition();

  const linhas = useMemo(() => estimarLinhas(texto), [texto]);
  const podeEnviar = linhas >= LINHAS_MIN;

  function enviar() {
    setErro(null);
    start(async () => {
      try {
        const r = await enviarRedacao({ temaId: tema.id, texto });
        if (!r.ok) {
          setErro(r.erro);
          return;
        }
        onCorrigida(r.dados);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível corrigir a redação.");
      }
    });
  }

  const trilho = (
    <>
      <TrilhoBloco>
        <p className="etiqueta">Proposta</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-100">{tema.tema}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{tema.comando}</p>
      </TrilhoBloco>

      <TrilhoBloco titulo="Sua redação">
        <div className="space-y-2">
          <TrilhoDado rotulo="Linhas (aprox.)" valor={linhas} />
          <TrilhoDado rotulo="Exigido" valor={`${LINHAS_MIN} a ${LINHAS_MAX}`} />
        </div>
        <div className="mt-3">
          <Progress
            value={Math.min(100, (linhas / LINHAS_MIN) * 100)}
            barClassName={
              linhas > LINHAS_MAX ? "bg-amber-500" : podeEnviar ? "bg-emerald-500" : "bg-indigo-500"
            }
          />
        </div>
        {linhas > LINHAS_MAX && (
          <p className="mt-2 text-xs leading-relaxed text-amber-300">
            Passou de {LINHAS_MAX} linhas. Na prova, o que exceder é desconsiderado.
          </p>
        )}
        {erro && <p className="mt-3 text-xs text-rose-300">{erro}</p>}
        <Button className="mt-3 w-full" onClick={enviar} disabled={!podeEnviar || enviando}>
          <Send className="h-4 w-4" />
          {enviando ? "Corrigindo…" : "Enviar para correção"}
        </Button>
        <button
          type="button"
          onClick={onVoltar}
          disabled={enviando}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar às propostas
        </button>
      </TrilhoBloco>
    </>
  );

  return (
    <PaginaLeitura trilho={trilho}>
      <div className="space-y-4">
        {tema.textos.map((t, i) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm">Texto de apoio {i + 1}</CardTitle>
              {t.conferido ? (
                <span
                  className="flex items-center gap-1.5 text-xs text-emerald-300"
                  title="O trecho foi encontrado literalmente na página de origem."
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  citação conferida
                </span>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-xs text-amber-300"
                  title="Não foi possível abrir a página para conferir o trecho. Confira você antes de usar o dado."
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  não conferida
                </span>
              )}
            </CardHeader>
            <CardContent className="px-5 py-5">
              <p className="text-[1.0625rem] leading-[1.65] whitespace-pre-line text-slate-100">
                {t.trecho}
              </p>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-300 transition-colors hover:text-indigo-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t.veiculo}
              </a>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PenLine className="h-4 w-4 text-indigo-400" />
              Sua redação
            </CardTitle>
            <span
              className={cn(
                "tabular text-xs",
                linhas > LINHAS_MAX ? "text-amber-300" : "text-slate-500"
              )}
            >
              ~{linhas} de {LINHAS_MIN}–{LINHAS_MAX} linhas
            </span>
          </CardHeader>
          <CardContent className="p-5">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={22}
              disabled={enviando}
              className={cn(
                inputCls,
                "resize-y text-[1.0625rem] leading-[1.7]",
                enviando && "opacity-60"
              )}
              placeholder="Escreva aqui o seu texto dissertativo-argumentativo…"
            />
          </CardContent>
        </Card>
      </div>
    </PaginaLeitura>
  );
}

// ---------------------------------------------------------------- texto de fora

/* -----------------------------------------------------------------------------
   Corrigir uma redacao escrita fora da plataforma

   O fluxo normal comeca na proposta gerada aqui, e quem ja escreveu para um
   tema de outro lugar ficava sem correcao. Aqui a pessoa informa o tema, o
   concurso e cola o texto.

   O concurso importa mais do que parece: e dele que sai o conteudo programatico
   que o corretor usa para julgar o repertorio no CAC — o criterio de peso 7.
   ----------------------------------------------------------------------------- */

function CorrigirExterna({
  concursos,
  concursoId,
  onConcurso,
  onCorrigida,
}: {
  concursos: ConcursoDTO[];
  concursoId: string;
  onConcurso: (id: string) => void;
  onCorrigida: (r: RedacaoDTO) => void;
}) {
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, start] = useTransition();

  const linhas = useMemo(() => estimarLinhas(texto), [texto]);
  const temTema = tema.trim().length >= 5;
  const podeEnviar = temTema && linhas >= LINHAS_MIN && !!concursoId;

  function enviar() {
    setErro(null);
    start(async () => {
      try {
        const r = await corrigirRedacaoExterna({ concursoId, tema, texto });
        if (!r.ok) {
          setErro(r.erro);
          return;
        }
        onCorrigida(r.dados);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível corrigir a redação.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-indigo-400" />
          Corrigir uma redação que você já escreveu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="rounded-sm border border-slate-800 bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-400">
          A correção usa os mesmos critérios do edital —{" "}
          <span className="font-medium text-slate-200">CAC, OT e DLP</span>, de 0 a 3 cada, com a
          nota final pela fórmula do item 13.3.4.4. O conteúdo programático do concurso escolhido
          entra na avaliação do CAC: é por ele que o corretor julga se o repertório é pertinente e
          se o que você afirmou sobre cada lei ou programa está correto.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Concurso</p>
            <select
              value={concursoId}
              onChange={(e) => onConcurso(e.target.value)}
              disabled={enviando}
              className={inputCls}
            >
              {concursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Tema</p>
            <Input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              disabled={enviando}
              placeholder="O tema sobre o qual você escreveu"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-slate-300">Corpo da redação</p>
            <span
              className={cn(
                "tabular text-xs",
                linhas > LINHAS_MAX
                  ? "text-amber-300"
                  : linhas >= LINHAS_MIN
                    ? "text-emerald-300"
                    : "text-slate-500"
              )}
            >
              ~{linhas} de {LINHAS_MIN}–{LINHAS_MAX} linhas
            </span>
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={18}
            disabled={enviando}
            className={cn(
              inputCls,
              "resize-y text-[1.0625rem] leading-[1.7]",
              enviando && "opacity-60"
            )}
            placeholder="Cole aqui o texto que você escreveu…"
          />
          {linhas > 0 && linhas < LINHAS_MIN && (
            <p className="mt-2 text-xs leading-relaxed text-amber-300">
              O edital exige no mínimo {LINHAS_MIN} linhas. Abaixo disso a prova recebe zero, então
              a correção não é enviada.
            </p>
          )}
          {linhas > LINHAS_MAX && (
            <p className="mt-2 text-xs leading-relaxed text-amber-300">
              Passou de {LINHAS_MAX} linhas. Na prova, o que excede é desconsiderado.
            </p>
          )}
        </div>

        {erro && <p className="rounded-sm bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{erro}</p>}

        <div className="flex justify-end">
          <Button onClick={enviar} disabled={!podeEnviar || enviando}>
            <Send className="h-4 w-4" />
            {enviando ? "Corrigindo…" : "Enviar para correção"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- resultado

function faixaCor(pct: number) {
  if (pct >= 0.8) return "bg-emerald-500";
  if (pct >= 0.6) return "bg-indigo-500";
  if (pct >= 0.4) return "bg-amber-500";
  return "bg-rose-500";
}

function Resultado({ redacao, onVoltar }: { redacao: RedacaoDTO; onVoltar: () => void }) {
  const total = redacao.total ?? 0;

  return (
    <PaginaLeitura>
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle className="text-base">Correção</CardTitle>
            <p className="etiqueta">~{redacao.linhas} linhas</p>
          </CardHeader>
          <CardContent className="px-5 py-6">
            <p className="etiqueta">Nota final</p>
            <p className="tabular mt-1 text-5xl font-bold leading-none text-slate-100">
              {fmtNota.format(total)}
              <span className="text-2xl text-slate-500"> / {NOTA_MAX}</span>
            </p>
            {total === 0 && (
              <p className="mt-2 text-sm text-rose-300">
                Nota zero: fuga ao tema, descumprimento do comando ou texto incompatível com a
                forma dissertativa zeram a prova inteira, segundo o edital.
              </p>
            )}
            <div className="mt-4">
              <Progress value={(total / NOTA_MAX) * 100} barClassName={faixaCor(total / NOTA_MAX)} />
            </div>
            {redacao.resumo && (
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{redacao.resumo}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Critérios do edital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-5 py-5">
            {redacao.criterios.map((c) => (
              <div key={c.numero}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="min-w-0 text-sm font-medium text-slate-200">
                    <span className="tabular text-slate-500">{c.sigla}</span> {c.titulo}{" "}
                    <span className="tabular text-xs text-slate-500">
                      (peso {fmtPeso.format(c.peso)})
                    </span>
                  </p>
                  <p className="tabular shrink-0 text-sm font-semibold text-slate-100">
                    {c.nota}
                    <span className="text-slate-500">/{NOTA_MAX_CRITERIO}</span>
                  </p>
                </div>
                <Progress
                  value={(c.nota / NOTA_MAX_CRITERIO) * 100}
                  barClassName={faixaCor(c.nota / NOTA_MAX_CRITERIO)}
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{c.comentario}</p>
              </div>
            ))}
            <p className="border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-500">
              Nota final = [(CAC × 7) + (OT × 1,5) + (DLP × 1,5)] ÷ 0,3 — item 13.3.4.4 do edital.
              O CAC sozinho vale 70% da nota.
            </p>
          </CardContent>
        </Card>

        {(redacao.pontosFortes.length > 0 || redacao.aMelhorar.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {redacao.pontosFortes.length > 0 && (
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-sm text-emerald-300">Pontos fortes</CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-4">
                  <ul className="space-y-1.5 text-sm leading-relaxed text-slate-300">
                    {redacao.pontosFortes.map((p, i) => (
                      <li key={i}>— {p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {redacao.aMelhorar.length > 0 && (
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-sm text-amber-300">A melhorar</CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-4">
                  <ul className="space-y-1.5 text-sm leading-relaxed text-slate-300">
                    {redacao.aMelhorar.map((p, i) => (
                      <li key={i}>— {p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-slate-400" />
              O que você escreveu
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <p className="text-sm leading-relaxed whitespace-pre-line text-slate-300">
              {redacao.texto}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="secondary" onClick={onVoltar}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </PaginaLeitura>
  );
}

// ---------------------------------------------------------------- histórico

function Historico({
  redacoes,
  onAbrir,
}: {
  redacoes: RedacaoDTO[];
  onAbrir: (r: RedacaoDTO) => void;
}) {
  if (redacoes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-400">
          Você ainda não enviou nenhuma redação.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      <div className="grid gap-3 lg:grid-cols-2">
        {redacoes.map((r) => {
          const total = r.total ?? 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onAbrir(r)}
              className="min-w-0 rounded-sm border border-slate-800 bg-slate-900 p-4 text-left transition-colors hover:border-indigo-600/50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-100">{r.tema}</p>
                <span className="tabular shrink-0 text-sm font-bold text-slate-100">
                  {fmtNota.format(total)}
                  <span className="text-slate-500">/{NOTA_MAX}</span>
                </span>
              </div>
              <div className="mt-2">
                <Progress value={(total / NOTA_MAX) * 100} barClassName={faixaCor(total / NOTA_MAX)} />
              </div>
              <p className="tabular mt-2 text-xs text-slate-500">
                {fmtData.format(new Date(r.enviadaEm))} · ~{r.linhas} linhas
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
