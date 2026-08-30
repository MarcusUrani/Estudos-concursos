"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  responder,
  alternarFavorito,
  type QuestaoDTO,
  type ResultadoResposta,
} from "@/server/treino";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bolha, FitaGabarito } from "@/components/ui/bolha";
import { PaginaLeitura, TrilhoBloco, TrilhoDado } from "@/components/ui/pagina";
import { BotaoReporte } from "@/components/botao-reporte";
import { cn } from "@/lib/utils";
import {
  Star,
  CheckCircle2,
  XCircle,
  BookOpen,
  ScrollText,
  ArrowRight,
  RotateCcw,
  Trophy,
  SkipForward,
} from "lucide-react";

export type AcaoFinal = { label: string; onClick: () => void };

/** Sessao de resolucao reutilizavel: resolve a lista, corrige e mostra resultado final. */
export function TreinoSessao({
  questoes,
  acaoFinal,
  favoritosIniciais,
  indiceInicial = 0,
  acertosIniciais = 0,
  onProgresso,
  onConcluir,
}: {
  questoes: QuestaoDTO[];
  acaoFinal?: AcaoFinal;
  favoritosIniciais?: Record<string, boolean>;
  indiceInicial?: number;
  acertosIniciais?: number;
  onProgresso?: (indice: number, acertos: number) => void;
  onConcluir?: () => void;
}) {
  const [sessao, setSessao] = useState(0);
  const [indice, setIndice] = useState(indiceInicial);
  const [acertos, setAcertos] = useState(acertosIniciais);
  const [fim, setFim] = useState(false);

  // Historico por questao, na ordem — alimenta a fita de gabarito.
  // `true` acerto, `false` erro, `null` pulada.
  //
  // Ao RETOMAR uma sessao so conhecemos os totais (indice e acertos), nao a
  // ordem original nem quais foram puladas: por isso a semente agrupa os
  // acertos antes dos erros e nao reconstroi pulos. O placar fica correto; a
  // posicao exata de cada marca no trecho ja respondido, nao.
  const [resultados, setResultados] = useState<(boolean | null)[]>(() => [
    ...Array<boolean>(acertosIniciais).fill(true),
    ...Array<boolean>(Math.max(0, indiceInicial - acertosIniciais)).fill(false),
  ]);

  /** `null` = pulada: avanca sem contar acerto nem erro. */
  function avancar(resultado: boolean | null) {
    const novoAcertos = resultado === true ? acertos + 1 : acertos;
    if (resultado === true) setAcertos(novoAcertos);
    setResultados((r) => [...r, resultado]);
    const novoIndice = indice + 1;
    if (novoIndice >= questoes.length) {
      setFim(true);
      onConcluir?.();
    } else {
      setIndice(novoIndice);
      onProgresso?.(novoIndice, novoAcertos);
    }
  }

  function refazer() {
    setIndice(0);
    setAcertos(0);
    setResultados([]);
    setFim(false);
    setSessao((s) => s + 1);
  }

  if (fim) {
    // O aproveitamento e sobre o que foi RESPONDIDO: contar questao pulada como
    // erro puniria quem preferiu nao chutar, que e justamente o comportamento
    // que o botao de pular existe para permitir.
    const puladas = resultados.filter((r) => r === null).length;
    const respondidasFim = Math.max(0, questoes.length - puladas);
    const pct = respondidasFim ? Math.round((acertos / respondidasFim) * 100) : 0;
    return (
      <PaginaLeitura>
        <Card>
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-indigo-500/15 text-indigo-300">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-100">Concluído!</h2>
              <p className="mt-1 text-slate-400">
                {respondidasFim > 0 ? (
                  <>
                    Você acertou{" "}
                    <span className="tabular font-semibold text-emerald-400">
                      {acertos} de {respondidasFim}
                    </span>{" "}
                    ({pct}%).
                  </>
                ) : (
                  "Você pulou todas as questões desta sessão."
                )}
                {puladas > 0 && (
                  <span className="tabular block text-sm text-slate-500">
                    {puladas} {puladas === 1 ? "pulada" : "puladas"}
                  </span>
                )}
              </p>
            </div>

            {/* O cartao-resposta inteiro da sessao: onde ela errou e onde
                acertou, na ordem. E a informacao que a porcentagem apaga. */}
            <FitaGabarito
              resultados={resultados}
              total={questoes.length}
              className="justify-center"
            />

            <div className="w-full max-w-xs">
              <Progress
                value={pct}
                barClassName={
                  pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-indigo-500" : "bg-rose-500"
                }
              />
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button onClick={refazer} variant="secondary">
                <RotateCcw className="h-4 w-4" />
                Refazer
              </Button>
              {acaoFinal && (
                <Button onClick={acaoFinal.onClick}>
                  {acaoFinal.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </PaginaLeitura>
    );
  }

  const atual = questoes[indice];
  return (
    <Questao
      key={`${sessao}-${atual.id}`}
      questao={atual}
      indice={indice}
      total={questoes.length}
      resultados={resultados}
      favoritoInicial={favoritosIniciais?.[atual.id] ?? false}
      onProxima={(acertou) => avancar(acertou)}
      onPular={() => avancar(null)}
    />
  );
}

function Questao({
  questao,
  indice,
  total,
  resultados,
  favoritoInicial,
  onProxima,
  onPular,
}: {
  questao: QuestaoDTO;
  indice: number;
  total: number;
  resultados: (boolean | null)[];
  favoritoInicial: boolean;
  onProxima: (acertou: boolean) => void;
  onPular: () => void;
}) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoResposta | null>(null);
  const [favorito, setFavorito] = useState(favoritoInicial);
  const [pending, startTransition] = useTransition();
  const inicio = useState(() => Date.now())[0];

  function confirmar() {
    if (!selecionada || resultado) return;
    const tempo = Math.round((Date.now() - inicio) / 1000);
    startTransition(async () => {
      const r = await responder(questao.id, selecionada, tempo);
      setResultado(r);
    });
  }

  function toggleFav() {
    startTransition(async () => {
      const fav = await alternarFavorito(questao.id);
      setFavorito(fav);
    });
  }

  const respondidas = resultados.filter((r) => r !== null).length;
  const acertosSessao = resultados.filter((r) => r === true).length;
  const puladas = resultados.filter((r) => r === null).length;

  // Tudo que NAO e a questao mora no trilho: posicao, placar, classificacao e
  // as acoes sobre a questao. A coluna de leitura fica so com enunciado,
  // alternativas e correcao — que e o que a pessoa precisa ler sem desviar.
  const trilho = (
    <>
      <TrilhoBloco>
        {/* Em tela estreita posicao e fita dividem a mesma linha: cada pixel
            gasto aqui empurra o enunciado para fora da tela. No trilho, em
            `xl`, elas empilham. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 xl:block">
          <div>
            <p className="etiqueta">Questão</p>
            <p className="tabular mt-1 text-2xl font-semibold leading-none text-slate-100 xl:mt-1.5 xl:text-3xl">
              {String(indice + 1).padStart(2, "0")}
              <span className="text-slate-500"> / {String(total).padStart(2, "0")}</span>
            </p>
          </div>
          <div className="xl:mt-4">
            <FitaGabarito resultados={resultados} atual={indice} total={total} />
          </div>
        </div>
      </TrilhoBloco>

      {/* Em tela estreita o trilho vira cabeçalho da questão — o placar aqui
          empurraria o enunciado para fora da tela. A fita acima já mostra o
          mesmo desempenho sem ocupar linha. */}
      {(respondidas > 0 || puladas > 0) && (
        <TrilhoBloco titulo="Placar" className="hidden xl:block">
          <div className="space-y-2">
            <TrilhoDado rotulo="Acertos" valor={acertosSessao} />
            <TrilhoDado rotulo="Erros" valor={respondidas - acertosSessao} />
            {/* So faz sentido com denominador: pular a primeira questao deixava
                `respondidas` em zero e a divisao virava NaN na tela. */}
            {respondidas > 0 && (
              <TrilhoDado
                rotulo="Aproveitamento"
                valor={`${Math.round((acertosSessao / respondidas) * 100)}%`}
              />
            )}
            {puladas > 0 && <TrilhoDado rotulo="Puladas" valor={puladas} />}
          </div>
        </TrilhoBloco>
      )}

      <TrilhoBloco titulo="Classificação">
        <div className="flex flex-wrap gap-2">
          <Badge>{questao.assunto}</Badge>
          {questao.subassunto && <Badge variant="neutral">{questao.subassunto}</Badge>}
          <Badge variant="neutral">{questao.banca}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            onClick={toggleFav}
            disabled={pending}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              favorito ? "text-amber-300" : "text-slate-400 hover:text-amber-300"
            )}
          >
            <Star className={cn("h-4 w-4", favorito && "fill-amber-400 text-amber-400")} />
            {favorito ? "Favoritada" : "Favoritar"}
          </button>
          {/* Reportar ja tira a questao das proximas sessoes desta pessoa; ficar
              nela depois de reportar nao faz sentido, entao o fecho do modal
              avanca. */}
          <BotaoReporte questaoId={questao.id} onReportada={onPular} />
        </div>
      </TrilhoBloco>
    </>
  );

  return (
    <PaginaLeitura trilho={trilho}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
      <Card>
        <CardContent className="space-y-5 px-5 py-6">
          {/* A coluna agora e so do enunciado, entao ele pode assumir o corpo
              de leitura de verdade: 17px com entrelinha aberta. E o texto que
              precisa ser relido duas ou tres vezes. */}
          {/* `whitespace-pre-line`: questao de interpretacao traz o texto de
              apoio no proprio enunciado, separado do comando por linha em
              branco. Sem isto o texto e o comando viram um paragrafo so. */}
          <p className="text-[1.0625rem] leading-[1.65] whitespace-pre-line text-slate-100">
            {questao.enunciado}
          </p>

          <div className="space-y-2">
            {questao.alternativas.map((alt, i) => {
              const escolhida = selecionada === alt.id;
              const correta = resultado?.alternativaCorretaId === alt.id;
              const erradaEscolhida = resultado && escolhida && !correta;

              return (
                <button
                  key={alt.id}
                  disabled={!!resultado}
                  onClick={() => setSelecionada(alt.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-sm border px-4 py-3 text-left text-sm transition-all",
                    !resultado &&
                      (escolhida
                        ? "border-indigo-500 bg-indigo-500/10 text-slate-100"
                        : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600"),
                    resultado && correta && "border-emerald-500 bg-emerald-500/10 text-emerald-100",
                    erradaEscolhida && "border-rose-500 bg-rose-500/10 text-rose-100",
                    resultado && !correta && !erradaEscolhida && "border-slate-800 opacity-60"
                  )}
                >
                  {/* A bolha de gabarito no lugar do quadrado: o mesmo gesto do
                      cartao-resposta de papel, e o mesmo simbolo que aparece na
                      fita de progresso acima. */}
                  <Bolha
                    tamanho="lg"
                    estado={
                      resultado
                        ? correta
                          ? "certa"
                          : erradaEscolhida
                            ? "errada"
                            : "vazia"
                        : escolhida
                          ? "marcada"
                          : "vazia"
                    }
                    className={cn(
                      "mt-px",
                      escolhida && !resultado && "text-white",
                      resultado && (correta || erradaEscolhida) && "text-white",
                      !escolhida && !resultado && "text-slate-400"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </Bolha>
                  <span className="flex-1 pt-1">{alt.texto}</span>
                  {resultado && correta && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {erradaEscolhida && <XCircle className="h-5 w-5 text-rose-400" />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {resultado && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 overflow-hidden"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-4 py-3 text-sm font-medium",
                    resultado.acertou
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-rose-500/10 text-rose-300"
                  )}
                >
                  {resultado.acertou ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Resposta correta!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" /> Resposta incorreta.
                    </>
                  )}
                </div>

                <div className="rounded-sm border border-slate-800 bg-slate-950/40 p-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                    <BookOpen className="h-4 w-4" /> Comentário
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">{resultado.explicacao}</p>
                  {resultado.fonte && (
                    <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                      <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <span>
                        <span className="font-medium text-slate-300">Fonte: </span>
                        {resultado.fonte}
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!resultado ? (
            // Pular fica AO LADO de confirmar, nao escondido no trilho: e uma
            // saida da questao atual, do mesmo nivel de "responder". Secundario
            // no peso visual para nao competir com a acao principal.
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={confirmar}
                disabled={!selecionada || pending}
              >
                {pending ? "Corrigindo..." : "Confirmar resposta"}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={onPular}
                disabled={pending}
                title="Passa para a próxima sem responder — não conta como erro"
              >
                <SkipForward className="h-4 w-4" />
                Pular
              </Button>
            </div>
          ) : (
            <Button size="lg" className="w-full" onClick={() => onProxima(resultado.acertou)}>
              {indice + 1 >= total ? "Ver resultado" : "Próxima questão"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </PaginaLeitura>
  );
}
