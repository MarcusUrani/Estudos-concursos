import type { QSeed } from "./tipos";
import questoesJson, { ASSUNTOS_BASE, MATERIAS, CONCURSO } from "./from-json";
import questoesProgramaDFSocial from "./programa-df-social";
import questoesDFBrincar from "./df-brincar";
import questoesIncentivaDF from "./incentiva-df";
import questoesAgentesCidadania from "./agentes-cidadania";
import questoesAgentesAmbiental from "./agentes-cidadania-ambiental";
import questoesDFAlfabetizacao from "./df-alfabetizacao";
import questoesSOSMulher from "./sos-mulher";

export type { QSeed } from "./tipos";
export { MATERIAS, CONCURSO };

// Concatena todas as fontes de questoes: questoes.json + seed files avulsos.
export const TODAS_QUESTOES: QSeed[] = [
  ...questoesJson,
  ...questoesProgramaDFSocial,
  ...questoesDFBrincar,
  ...questoesIncentivaDF,
  ...questoesAgentesCidadania,
  ...questoesAgentesAmbiental,
  ...questoesDFAlfabetizacao,
  ...questoesSOSMulher,
];

// Monta a estrutura de assuntos canonicos a partir das proprias questoes:
// para cada assunto, agrega os subassuntos distintos encontrados. Assim o seed
// cria exatamente os subassuntos referenciados, sem listas manuais.
const subsPorAssunto = new Map<string, Set<string>>();
for (const q of TODAS_QUESTOES) {
  if (!q.subassunto) continue;
  if (!subsPorAssunto.has(q.assunto)) subsPorAssunto.set(q.assunto, new Set());
  subsPorAssunto.get(q.assunto)!.add(q.subassunto);
}

export const ASSUNTOS: {
  nome: string;
  descricao: string;
  materia: string;
  subassuntos: string[];
}[] = ASSUNTOS_BASE.map((a) => ({
  nome: a.nome,
  descricao: a.descricao,
  materia: a.materia,
  subassuntos: [...(subsPorAssunto.get(a.nome) ?? [])].sort((x, y) => x.localeCompare(y, "pt")),
}));
