import * as React from "react";
import { cn } from "@/lib/utils";

export type EstadoBolha = "vazia" | "certa" | "errada" | "atual" | "marcada" | "pulada";

const ESTADO: Record<EstadoBolha, string> = {
  vazia: "",
  marcada: "bolha-marcada bolha-cheia",
  certa: "bolha-certa bolha-cheia",
  errada: "bolha-errada bolha-cheia",
  atual: "bolha-atual",
  pulada: "bolha-pulada bolha-cheia",
};

const TAMANHO = {
  sm: "h-2.5 w-2.5",
  md: "h-4 w-4",
  lg: "h-7 w-7 text-xs font-semibold",
} as const;

/** A bolha do cartao-resposta — o elemento de marca da interface.
 *
 *  Aparece em tres papeis, sempre com o mesmo significado de "marcar":
 *  1. a esquerda de cada alternativa (com a letra A-E dentro);
 *  2. como fita de progresso da sessao, uma bolha por questao;
 *  3. como sequencia de acertos no dashboard.
 *
 *  Os estilos vivem em globals.css para que o preenchimento seja uma unica
 *  transicao de cor, e nao um recalculo de classes a cada resposta. */
export function Bolha({
  estado = "vazia",
  tamanho = "md",
  className,
  children,
  ...props
}: {
  estado?: EstadoBolha;
  tamanho?: keyof typeof TAMANHO;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("bolha", TAMANHO[tamanho], ESTADO[estado], className)}
      {...props}
    >
      {children}
    </span>
  );
}

/** Fita de progresso da sessao: uma bolha por questao, na ordem em que foram
 *  respondidas. Da a posicao e o desempenho num relance, sem texto. */
export function FitaGabarito({
  resultados,
  atual,
  total,
  className,
}: {
  /** `true` acerto, `false` erro, `null` pulada — na ordem em que ocorreram. */
  resultados: (boolean | null)[];
  /** Indice (base 0) da questao em tela. */
  atual?: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="img"
      aria-label={`${resultados.filter((r) => r === true).length} acertos e ${
        resultados.filter((r) => r === false).length
      } erros em ${resultados.filter((r) => r !== null).length} respondidas, ${
        resultados.filter((r) => r === null).length
      } puladas, ${total} no total`}
    >
      {Array.from({ length: total }, (_, i) => {
        const estado: EstadoBolha =
          i === atual
            ? "atual"
            : i < resultados.length
              ? resultados[i] === null
                ? "pulada"
                : resultados[i]
                  ? "certa"
                  : "errada"
              : "vazia";
        return <Bolha key={i} estado={estado} tamanho="sm" />;
      })}
    </div>
  );
}
