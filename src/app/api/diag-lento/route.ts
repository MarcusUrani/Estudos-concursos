/* TEMPORARIO — mede o teto de execucao de funcao na Vercel. Remover. */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const ms = Math.min(90_000, Number(new URL(req.url).searchParams.get("ms") ?? 1000));
  const t0 = Date.now();
  await new Promise((r) => setTimeout(r, ms));
  return NextResponse.json({ pedido: ms, real: Date.now() - t0 });
}
