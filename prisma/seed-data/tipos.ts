// Tipos e estrutura de assuntos compartilhados pelo seed.

export type QSeed = {
  assunto: string;
  subassunto?: string;
  nivel: "Facil" | "Medio" | "Dificil";
  dificuldade: number; // 1..5
  enunciado: string;
  alternativas: { texto: string; correta: boolean }[]; // SEMPRE multipla escolha
  explicacao: string;
  fonteLegal?: string;
  palavrasChave?: string[];
};

// A lista de assuntos canonicos agora vive em `from-json.ts` (ASSUNTOS_BASE) e
// e montada com os subassuntos derivados das questoes em `index.ts` (ASSUNTOS).
