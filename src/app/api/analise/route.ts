// Dispara o pipeline de IA (Fase 2) para um projeto e devolve um resumo.
import { NextResponse } from "next/server";
import { getAccessibleProject } from "@/lib/projects";
import { hasAIKey } from "@/lib/ai/llm";
import { runAnalysisForProject } from "@/lib/ai/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let projectId: string | undefined;
  try {
    const body = await request.json();
    projectId = body?.projectId;
  } catch {
    /* ignore */
  }
  if (!projectId) {
    return NextResponse.json({ error: "projectId obrigatório." }, { status: 400 });
  }

  const project = await getAccessibleProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }
  if (!hasAIKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurado no servidor." },
      { status: 400 }
    );
  }

  try {
    const summary = await runAnalysisForProject(projectId);
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
