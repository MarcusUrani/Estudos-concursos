import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata segundos em "Xh Ym" ou "Ym". */
export function formatDuracao(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const NIVEIS = ["Facil", "Medio", "Dificil"] as const;
export type Nivel = (typeof NIVEIS)[number];

/** Intervalos da revisao espacada (dias) por nivel. */
export const INTERVALOS_REVISAO = [1, 3, 7, 15, 30];

export function csvParaLista(csv?: string | null): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
