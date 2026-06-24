// Webhook chamado pela Apify quando um run termina. Ingere os resultados.
import { NextResponse } from "next/server";
import { ingestRun } from "@/lib/collectors/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const token = url.searchParams.get("token");
  if (!jobId || !token) {
    return NextResponse.json({ error: "params" }, { status: 400 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    /* corpo pode vir vazio em testes */
  }

  const { status } = await ingestRun(jobId, token, payload);
  return NextResponse.json({ ok: status === 200 }, { status });
}
