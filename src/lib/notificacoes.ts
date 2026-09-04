/* =============================================================================
   Tipos de notificacao

   Quatro, e nao mais: cada tipo precisa ser distinguivel de relance pela cor e
   pelo icone. Uma lista maior vira arco-iris e para de comunicar.

   O tipo e guardado como texto no banco (o Postgres aqui nao usa enum, mesma
   escolha de `nivel` nas questoes). Quem valida e `ehTipoValido`, chamado antes
   de gravar — modelo de dados frouxo, entrada apertada.
   ============================================================================= */

export const TIPOS = [
  {
    id: "novidade",
    rotulo: "Novidade",
    /** Aparece no formulario do admin como dica do que cabe em cada tipo. */
    ajuda: "Recurso ou conteúdo novo na plataforma.",
    variante: "default",
    icone: "Sparkles",
  },
  {
    id: "atualizacao",
    rotulo: "Atualização",
    ajuda: "Mudança em algo que já existia.",
    variante: "success",
    icone: "RefreshCw",
  },
  {
    id: "manutencao",
    rotulo: "Manutenção",
    ajuda: "Instabilidade, indisponibilidade ou janela de manutenção.",
    variante: "warning",
    icone: "Wrench",
  },
  {
    id: "aviso",
    rotulo: "Aviso",
    ajuda: "Recado importante — prazo de edital, mudança de regra.",
    variante: "danger",
    icone: "AlertTriangle",
  },
] as const;

export type TipoNotificacao = (typeof TIPOS)[number]["id"];

export function ehTipoValido(v: unknown): v is TipoNotificacao {
  return typeof v === "string" && TIPOS.some((t) => t.id === v);
}

export function tipoDe(id: string) {
  return TIPOS.find((t) => t.id === id) ?? TIPOS[0];
}

/** Limites de tamanho. O corpo cabe um comunicado, nao um artigo. */
export const MAX_TITULO = 120;
export const MAX_CORPO = 2000;
