"use server";

import { auth } from "@/auth";

// Envio de feedback/sugestoes da plataforma por e-mail (Mailgun). As credenciais
// vêm de variaveis de ambiente (nunca hardcoded):
//   MAILGUN_API_KEY  - chave privada da API
//   MAILGUN_DOMAIN   - dominio de envio (ex.: sandboxXXXX.mailgun.org)
//   MAILGUN_FROM     - (opcional) remetente; padrao postmaster@DOMAIN
//   MAILGUN_BASE_URL - (opcional) https://api.mailgun.net (US) ou .eu (EU)
//   FEEDBACK_TO      - (opcional) destinatario; padrao marcus.urani20@gmail.com

const BASE_URL = process.env.MAILGUN_BASE_URL || "https://api.mailgun.net";
const DESTINO = process.env.FEEDBACK_TO || "marcus.urani30@gmail.com";

export type FeedbackInput = { tipo: string; mensagem: string; pagina?: string };
// Retorna um resultado em vez de lancar: em producao o Next.js redige as
// mensagens de erros lancados em Server Actions, escondendo o motivo do usuario.
export type ResultadoFeedback = { ok: true } | { ok: false; erro: string };

export async function enviarFeedback(input: FeedbackInput): Promise<ResultadoFeedback> {
  const session = await auth();
  if (!session?.user) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const mensagem = input.mensagem?.trim();
  if (!mensagem) return { ok: false, erro: "Escreva sua mensagem." };
  const tipo = (input.tipo || "Sugestão").trim().slice(0, 60);

  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) {
    return { ok: false, erro: "Envio de feedback não configurado no servidor." };
  }

  const from = process.env.MAILGUN_FROM || `Gabarix <postmaster@${domain}>`;
  const nome = session.user.name || "Usuário";
  const email = session.user.email || "—";
  const quando = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const corpo = [
    `Tipo: ${tipo}`,
    `De: ${nome} <${email}>`,
    input.pagina ? `Página: ${input.pagina}` : null,
    `Data: ${quando}`,
    "",
    "Mensagem:",
    mensagem,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams();
  params.set("from", from);
  params.set("to", DESTINO);
  params.set("h:Reply-To", email);
  params.set("subject", `[Gabarix] ${tipo} — ${nome}`);
  params.set("text", corpo);

  try {
    const res = await fetch(`${BASE_URL}/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`api:${apiKey}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const detalhe = await res.text().catch(() => "");
      // Detalhe completo so no log do servidor.
      console.error("Mailgun falhou:", res.status, detalhe);
      return {
        ok: false,
        erro: `Não foi possível enviar agora (erro ${res.status}). Tente novamente mais tarde.`,
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("Erro ao chamar Mailgun:", e);
    return { ok: false, erro: "Falha de conexão ao enviar. Tente novamente." };
  }
}
