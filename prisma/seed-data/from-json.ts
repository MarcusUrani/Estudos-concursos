import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { QSeed } from "./tipos";

// Carrega o banco bruto gerado por IA (questoes.json na raiz do projeto) e o
// padroniza para o formato QSeed:
//  - normaliza `nivel` para "Facil" | "Medio" | "Dificil" (sem acento);
//  - mapeia o `assunto` (346 rotulos livres) para um dos assuntos canonicos;
//  - preserva o rotulo original como `subassunto` (parte apos o primeiro " - ").
// `prisma db seed` roda com cwd = raiz do projeto, entao o caminho relativo
// abaixo resolve para <raiz>/questoes.json.
type Raw = {
  assunto: string;
  nivel: string;
  dificuldade: number;
  enunciado: string;
  alternativas: { texto: string; correta: boolean }[];
  explicacao: string;
  fonteLegal?: string;
  palavrasChave?: string[];
};

// Materias (disciplinas) que agrupam os assuntos. Ordem = ordem de exibicao.
export const MATERIAS: { nome: string; descricao: string }[] = [
  { nome: "Assistência Social (SUAS)", descricao: "Arcabouço nacional do SUAS." },
  { nome: "Benefícios e Programas Sociais do DF", descricao: "Leis e programas sociais do Distrito Federal." },
  { nome: "Políticas para as Mulheres", descricao: "Proteção e políticas para mulheres." },
  { nome: "Legislação e Organização do DF", descricao: "Lei Orgânica, regime dos servidores e carreira do DF." },
  { nome: "Conhecimentos sobre o Distrito Federal", descricao: "Realidade, geografia e história do DF e RIDE." },
];

// Nomes completos dos assuntos (constantes reutilizadas no mapeamento).
const A = {
  PNAS: "Política Nacional de Assistência Social (PNAS/2004)",
  NOB: "Norma Operacional Básica do SUAS (NOB/SUAS 2012)",
  BENEF: "Benefícios Eventuais da Assistência Social do DF (Lei nº 5.165/2013 e Decreto nº 35.191/2014)",
  PLANO: "Plano DF Social (Lei nº 7.008/2021 e Decreto nº 42.872/2021)",
  GAS: "Programa Cartão Gás do DF (Lei nº 6.938/2021 e Decreto nº 42.376/2021)",
  PRATO: "Programa Cartão Prato Cheio (Lei nº 7.009/2021 e Decreto nº 42.873/2021)",
  REST: "Restaurante Comunitário / SISAN (Decreto nº 33.329/2011)",
  MARIA: "Lei Maria da Penha (Lei nº 11.340/2006)",
  PDPM: "Plano Distrital de Políticas para as Mulheres (II PDPM)",
  LODF: "Lei Orgânica do Distrito Federal (LODF)",
  LEI840: "Regime Jurídico dos Servidores do DF (LC nº 840/2011)",
  LEI7484: "Carreira de Desenvolvimento e Assistência Social do DF (Lei nº 7.484/2024)",
  RIDE: "Realidade do DF e RIDE (LC nº 94/1998, geografia e história)",
} as const;

// Lista canonica de assuntos: nome completo + materia + descricao. Ordem importa.
export const ASSUNTOS_BASE: { nome: string; materia: string; descricao: string }[] = [
  { nome: A.PNAS, materia: "Assistência Social (SUAS)", descricao: "Proteções, seguranças e territorialização." },
  { nome: A.NOB, materia: "Assistência Social (SUAS)", descricao: "Gestão, financiamento e vigilância socioassistencial." },
  { nome: A.BENEF, materia: "Benefícios e Programas Sociais do DF", descricao: "Provisões suplementares e temporárias." },
  { nome: A.PLANO, materia: "Benefícios e Programas Sociais do DF", descricao: "Programa de proteção social do DF." },
  { nome: A.GAS, materia: "Benefícios e Programas Sociais do DF", descricao: "Auxílio gás do DF." },
  { nome: A.PRATO, materia: "Benefícios e Programas Sociais do DF", descricao: "Segurança alimentar." },
  { nome: A.REST, materia: "Benefícios e Programas Sociais do DF", descricao: "SISAN / segurança alimentar." },
  { nome: A.MARIA, materia: "Políticas para as Mulheres", descricao: "Violência doméstica e familiar contra a mulher." },
  { nome: A.PDPM, materia: "Políticas para as Mulheres", descricao: "Plano Distrital de Políticas para as Mulheres." },
  { nome: A.LODF, materia: "Legislação e Organização do DF", descricao: "Ordem social e organização do DF." },
  { nome: A.LEI840, materia: "Legislação e Organização do DF", descricao: "Regime jurídico dos servidores do DF." },
  { nome: A.LEI7484, materia: "Legislação e Organização do DF", descricao: "Carreira de Desenvolvimento e Assistência Social." },
  { nome: A.RIDE, materia: "Conhecimentos sobre o Distrito Federal", descricao: "Realidade do DF e RIDE." },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Mapeia um rotulo livre de assunto para um dos assuntos canonicos.
// A ordem importa: as regras mais especificas vem primeiro.
export function mapAssunto(raw: string): string {
  const t = norm(raw);
  if (/7\.484/.test(t)) return A.LEI7484;
  if (/lei organica do distrito federal|\blodf\b/.test(t)) return A.LODF;
  if (/840/.test(t)) return A.LEI840;
  if (/maria da penha/.test(t)) return A.MARIA;
  if (/pdpm|politica para mulheres|politica distrital.*mulher/.test(t)) return A.PDPM;
  if (/plano df social/.test(t)) return A.PLANO;
  if (/cartao gas|gas do distrito/.test(t)) return A.GAS;
  if (/prato cheio/.test(t)) return A.PRATO;
  if (/restaurante comunitario|sisan/.test(t)) return A.REST;
  if (/\bride\b|realidade do df/.test(t)) return A.RIDE;
  if (/beneficio[s]?\s*eventua/.test(t)) return A.BENEF;
  if (/\bbpc\b|prestacao continuada/.test(t)) return "Fundamentos"; // descartado (assunto removido)
  if (/pnas/.test(t)) return A.PNAS;
  if (/\bnob\b|nob-rh|nob\/suas/.test(t)) return A.NOB;
  if (/gestao|financ|instanc|conselho|controle social|\bcib\b|\bcit\b|pactua|recursos humanos|marcos operacionais|comando unico|atribuicoes dos entes|descentraliza|pacto federativo|mesa de negociacao|prontuario|\brma\b|cadsuas|cadastro unico|cadunico|\bigd\b|\bfnas\b|tipificacao|niveis de gestao|orcamento|relatorio/.test(t))
    return A.NOB;
  if (/protecao social|protecoes afiancada|seguranca|matricialidade|territorializa|vigilancia|equipament|\bcras\b|\bcreas\b|centro pop|centro-dia|acolhiment|rede socioassistencial|publico da pnas|conceitos da pnas|trabalho em rede|servico|scfv|convivio|\bpeti\b|abordagem social|residencia inclusiva|familia acolhedora|republica|alta complexidade|media complexidade|risco social|primeira infancia|crianca feliz|\bpaif\b|\bpaefi\b/.test(t))
    return A.PNAS;
  return "Fundamentos"; // fallback descartado
}

const NIVEL: Record<string, QSeed["nivel"]> = {
  facil: "Facil",
  medio: "Medio",
  media: "Medio",
  dificil: "Dificil",
};

function mapNivel(raw: string): QSeed["nivel"] {
  return NIVEL[norm(raw)] ?? "Medio";
}

// subassunto = parte apos o primeiro " - " do rotulo original (preserva a
// granularidade). Se nao houver, fica sem subassunto.
function mapSubassunto(raw: string): string | undefined {
  const i = raw.indexOf(" - ");
  if (i === -1) return undefined;
  const sub = raw.slice(i + 3).trim();
  return sub.length ? sub : undefined;
}

function load(): Raw[] {
  const json = readFileSync(resolve(process.cwd(), "questoes.json"), "utf8");
  return JSON.parse(json) as Raw[];
}

const questoes: QSeed[] = load()
  // Defesa: o seed exige >=3 alternativas e exatamente 1 correta.
  .filter((q) => q.alternativas?.length >= 3 && q.alternativas.filter((a) => a.correta).length === 1)
  .map((q) => ({
    assunto: mapAssunto(q.assunto),
    subassunto: mapSubassunto(q.assunto),
    nivel: mapNivel(q.nivel),
    dificuldade: q.dificuldade,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    explicacao: q.explicacao,
    fonteLegal: q.fonteLegal,
    palavrasChave: q.palavrasChave,
  }))
  // O assunto "Fundamentos" foi removido do banco: descarta as questoes que
  // caem nele (LOAS/BPC/principios/diretrizes/fallback) para o seed nao recria-lo.
  .filter((q) => q.assunto !== "Fundamentos");

export default questoes;
