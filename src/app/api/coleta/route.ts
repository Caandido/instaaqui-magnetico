// Dispara a coleta de um projeto e consulta o status dos jobs.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAccessibleProject } from "@/lib/projects";
import { startCollectionForProject } from "@/lib/collectors/service";

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
  if (!process.env.APIFY_TOKEN) {
    return NextResponse.json(
      { error: "APIFY_TOKEN não configurado no servidor." },
      { status: 400 }
    );
  }

  const jobs = await startCollectionForProject(projectId);
  return NextResponse.json({ ok: true, jobs });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId obrigatório." }, { status: 400 });
  }

  const project = await getAccessibleProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const jobs = await db.collectionJob.findMany({
    where: { projectId },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      itemsCollected: true,
      competitorId: true,
      error: true,
    },
  });

  return NextResponse.json({ jobs });
}
