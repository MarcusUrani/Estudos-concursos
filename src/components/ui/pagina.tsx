import * as React from "react";
import { cn } from "@/lib/utils";

/* =============================================================================
   Sistema de layout

   Existem DUAS larguras no app, e so duas. A escolha entre elas nao e estetica,
   e sobre o que a tela pede.

   `Pagina` — telas de PANORAMA: dashboard, indices, listas, historico. Aqui a
   largura e util de verdade: mais coluna significa mais item visivel sem rolar.
   Cresce ate 1560px.

   `PaginaLeitura` — telas de UMA COISA POR VEZ: resolver questao, ler um tema.
   Aqui largura e inimiga. Passando de ~75 caracteres por linha o olho erra a
   volta da linha, e enunciado de prova e justamente texto denso que exige
   releitura. Entao a coluna de texto NAO cresce. Quem cresce e o `trilho`: uma
   faixa fixa a direita que recebe o contexto da sessao — progresso, placar,
   tempo, filtros. Em tela larga o espaco que sobrava vira informacao, em vez de
   virar margem.

   A resposta para "a pagina fica vazia no monitor grande" nao e esticar o
   texto. E ter o que colocar na margem.
   ============================================================================= */

/** Container de panorama. Ocupa a largura util e para em 1560px — passando
 *  disso a linha de olhar entre a lateral esquerda e a borda direita fica longa
 *  demais para varrer de relance. */
export function Pagina({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1560px] space-y-6", className)}
      {...props}
    />
  );
}

/** Cabecalho de pagina. A regua inferior nao e enfeite: e o que separa o rotulo
 *  do conteudo num formulario oficial, o mesmo gesto do `CardHeader`. */
export function Cabecalho({
  etiqueta,
  titulo,
  descricao,
  children,
  className,
}: {
  /** Rotulo de secao em caixa alta. Use para dizer ONDE se esta, nao para
   *  repetir o titulo. */
  etiqueta?: React.ReactNode;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  /** Acoes alinhadas a direita. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {etiqueta && <p className="etiqueta mb-2">{etiqueta}</p>}
        {/* `break-words`: o titulo carrega dado do usuario (nome, nome de
            legislacao) e uma palavra longa sem espaco furaria a tela. */}
        <h1 className="font-display text-2xl font-bold wrap-break-word text-slate-100 sm:text-3xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
            {descricao}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      )}
    </header>
  );
}

/** Caixa da area de sessao. Cabecalho e conteudo compartilham essa largura
 *  para que a borda esquerda seja sempre a mesma linha. */
export function PaginaSessao({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-3xl space-y-6 xl:max-w-296", className)}
      {...props}
    />
  );
}

/** Container de leitura: coluna de medida travada + trilho de contexto.
 *
 *  Abaixo de `xl` o trilho vira uma faixa acima do conteudo — em tela estreita
 *  ele e cabecalho de sessao, que e como ja funcionava. */
export function PaginaLeitura({
  trilho,
  children,
  className,
}: {
  trilho?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl xl:max-w-296",
        trilho && "grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-10",
        className
      )}
    >
      {/* Sem trilho a medida manda: a coluna nao cresce, so recentraliza. */}
      <div className={cn("min-w-0", !trilho && "mx-auto w-full max-w-3xl")}>{children}</div>
      {trilho && (
        // `order-first` em tela estreita: o progresso da sessao vem antes da
        // questao, como um cabecalho. Em `xl` volta a ordem do DOM e ele assume
        // a margem direita, grudado enquanto o enunciado rola.
        <aside className="order-first min-w-0 xl:order-0 xl:sticky xl:top-8 xl:self-start">
          <div className="space-y-5 xl:border-l xl:border-slate-800 xl:pl-6">{trilho}</div>
        </aside>
      )}
    </div>
  );
}

/** Bloco do trilho. De proposito NAO usa `Card`: o trilho e anotacao de margem,
 *  nao uma pilha de cartoes competindo com o conteudo. A separacao e so a
 *  regua de 1px. */
export function TrilhoBloco({
  titulo,
  children,
  className,
}: {
  titulo?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-t border-slate-800 pt-5 first:border-t-0 first:pt-0",
        className
      )}
    >
      {titulo && <p className="etiqueta mb-3">{titulo}</p>}
      {children}
    </section>
  );
}

/** Par rotulo/valor do trilho. O valor vai em mono porque quase sempre e
 *  numero que muda no lugar — placar, tempo, posicao. */
export function TrilhoDado({
  rotulo,
  valor,
  className,
}: {
  rotulo: React.ReactNode;
  valor: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <span className="text-sm text-slate-400">{rotulo}</span>
      <span className="tabular text-sm font-semibold text-slate-100">{valor}</span>
    </div>
  );
}
