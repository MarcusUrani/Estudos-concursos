// Controle de acesso a modulos por usuario.
//
// A revisao espacada fica disponivel para todos, exceto os e-mails listados
// abaixo. Mantemos como lista para ser explicito e facil de ajustar — hoje
// apenas a Jade (jadelinda@linda.com) esta sem acesso ao modulo.
const EMAILS_SEM_REVISAO = new Set(["jadelinda@linda.com"]);

/** Se o usuario (pelo e-mail) pode acessar o modulo de revisao espacada. */
export function podeAcessarRevisao(email?: string | null): boolean {
  if (!email) return true; // sem e-mail conhecido, libera (comportamento padrao)
  return !EMAILS_SEM_REVISAO.has(email.toLowerCase());
}
