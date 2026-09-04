/**
 * Teto do resumo do estudante: cabe um resumo longo de lei, nao um livro.
 *
 * Vive aqui, e nao em `server/resumo-pessoal.ts`, porque arquivo `"use server"`
 * so pode exportar funcao async — e porque o contador da tela e a validacao do
 * servidor precisam ser o MESMO numero. Duplicar seria deixar a tela dizer que
 * cabe e o servidor recusar.
 */
export const MAX_RESUMO = 20_000;
