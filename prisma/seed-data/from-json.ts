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

// Lista canonica de assuntos (nome + descricao), na ordem de exibicao.
export const ASSUNTOS_BASE: { nome: string; descricao: string }[] = [
  { nome: "Fundamentos", descricao: "LOAS, conceitos, objetivos, principios e diretrizes da assistencia social." },
  { nome: "PNAS", descricao: "Politica Nacional de Assistencia Social: protecoes, segurancas e territorializacao." },
  { nome: "NOB SUAS", descricao: "Gestao, financiamento, instancias e vigilancia socioassistencial do SUAS." },
  { nome: "Lei 840", descricao: "Lei Complementar nº 840/2011 - regime juridico dos servidores do DF." },
  { nome: "Lei Maria da Penha", descricao: "Lei 11.340/2006 - violencia domestica e familiar contra a mulher." },
  { nome: "PDPM", descricao: "Plano Distrital de Politica para as Mulheres." },
  { nome: "Plano DF Social", descricao: "Programa de protecao social do Distrito Federal." },
  { nome: "Cartao Gas", descricao: "Programa Cartao Gas do Distrito Federal." },
  { nome: "Cartao Prato Cheio", descricao: "Programa Cartao Prato Cheio - seguranca alimentar." },
  { nome: "Beneficios Eventuais", descricao: "Provisoes suplementares e temporarias da assistencia social." },
  { nome: "Restaurante Comunitario", descricao: "SISAN / Restaurante Comunitario - seguranca alimentar." },
  { nome: "RIDE", descricao: "Regiao Integrada de Desenvolvimento do DF e Entorno e realidade do DF." },
  { nome: "Lei 7.484/2024", descricao: "Carreira de Desenvolvimento e Assistencia Social do DF." },
  { nome: "Lei Organica do DF", descricao: "Lei Organica do Distrito Federal - Ordem Social e Meio Ambiente." },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Mapeia um rotulo livre de assunto para um dos assuntos canonicos.
// A ordem importa: as regras mais especificas vem primeiro.
export function mapAssunto(raw: string): string {
  const t = norm(raw);
  if (/7\.484/.test(t)) return "Lei 7.484/2024";
  if (/lei organica do distrito federal|\blodf\b/.test(t)) return "Lei Organica do DF";
  if (/840/.test(t)) return "Lei 840";
  if (/maria da penha/.test(t)) return "Lei Maria da Penha";
  if (/pdpm|politica para mulheres|politica distrital.*mulher/.test(t)) return "PDPM";
  if (/plano df social/.test(t)) return "Plano DF Social";
  if (/cartao gas|gas do distrito/.test(t)) return "Cartao Gas";
  if (/prato cheio/.test(t)) return "Cartao Prato Cheio";
  if (/restaurante comunitario|sisan/.test(t)) return "Restaurante Comunitario";
  if (/\bride\b|realidade do df/.test(t)) return "RIDE";
  if (/beneficio[s]?\s*eventua/.test(t)) return "Beneficios Eventuais";
  if (/\bbpc\b|prestacao continuada/.test(t)) return "Fundamentos";
  if (/pnas/.test(t)) return "PNAS";
  if (/\bnob\b|nob-rh|nob\/suas/.test(t)) return "NOB SUAS";
  if (/gestao|financ|instanc|conselho|controle social|\bcib\b|\bcit\b|pactua|recursos humanos|marcos operacionais|comando unico|atribuicoes dos entes|descentraliza|pacto federativo|mesa de negociacao|prontuario|\brma\b|cadsuas|cadastro unico|cadunico|\bigd\b|\bfnas\b|tipificacao|niveis de gestao|orcamento|relatorio/.test(t))
    return "NOB SUAS";
  if (/protecao social|protecoes afiancada|seguranca|matricialidade|territorializa|vigilancia|equipament|\bcras\b|\bcreas\b|centro pop|centro-dia|acolhiment|rede socioassistencial|publico da pnas|conceitos da pnas|trabalho em rede|servico|scfv|convivio|\bpeti\b|abordagem social|residencia inclusiva|familia acolhedora|republica|alta complexidade|media complexidade|risco social|primeira infancia|crianca feliz|\bpaif\b|\bpaefi\b/.test(t))
    return "PNAS";
  return "Fundamentos";
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
  }));

export default questoes;
