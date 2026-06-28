// Motivos de reporte de uma questao. Compartilhado entre cliente (modal) e
// servidor (validacao + exibicao no admin). Fica fora de "use server" porque
// arquivos server so podem exportar funcoes async.

export type MotivoReporte = { id: string; label: string };

export const MOTIVOS_REPORTE: MotivoReporte[] = [
  { id: "mal_elaborada", label: "Pergunta mal elaborada" },
  { id: "gabarito_errado", label: "Resposta (gabarito) errada" },
  { id: "comentario_errado", label: "Comentário/explicação errado" },
  { id: "fonte_errada", label: "Base legal incorreta" },
  { id: "desatualizada", label: "Questão desatualizada" },
  { id: "erro_digitacao", label: "Erro de digitação" },
  { id: "outro", label: "Outro" },
];

const MAPA = new Map(MOTIVOS_REPORTE.map((m) => [m.id, m.label]));

export function ehMotivoValido(id: string): boolean {
  return MAPA.has(id);
}

/** Converte um id de motivo no rotulo legivel (ou o proprio id se desconhecido). */
export function rotuloMotivo(id: string): string {
  return MAPA.get(id) ?? id;
}
