// Orquestra a coleta: inicia os runs da Apify (assíncrono) e ingere os
// resultados quando o webhook avisa que terminaram.

import crypto from "crypto";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/app-url";
import { getCollector } from "./index";
import { persistCollectResult } from "./normalize";

const MAX_POSTS = 12;

type JobSummary = { id: string; competitor: string; status: string };

// Dispara a coleta de todos os concorrentes de um projeto.
export async function startCollectionForProject(
  projectId: string
): Promise<JobSummary[]> {
  const competitors = await db.competitor.findMany({ where: { projectId } });
  if (competitors.length === 0) return [];

  const collector = getCollector();
  const base = getBaseUrl();
  const jobs: JobSummary[] = [];

  for (const c of competitors) {
    const token = crypto.randomBytes(16).toString("hex");
    const job = await db.collectionJob.create({
      data: {
        projectId,
        competitorId: c.id,
        status: "RUNNING",
        webhookToken: token,
      },
    });

    try {
      const webhookUrl = `${base}/api/coleta/webhook?jobId=${job.id}&token=${token}`;
      const { runId } = await collector.startRun(c.handle, {
        maxPosts: MAX_POSTS,
        webhookUrl,
      });
      await db.collectionJob.update({
        where: { id: job.id },
        data: { apifyRunId: runId },
      });
      jobs.push({ id: job.id, competitor: c.handle, status: "RUNNING" });
    } catch (e) {
      await db.collectionJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: String(e), finishedAt: new Date() },
      });
      jobs.push({ id: job.id, competitor: c.handle, status: "FAILED" });
    }
  }

  return jobs;
}

// Ingere o resultado de um run finalizado (chamado pelo webhook da Apify).
export async function ingestRun(
  jobId: string,
  token: string,
  payload: Record<string, unknown>
): Promise<{ status: number }> {
  const job = await db.collectionJob.findUnique({ where: { id: jobId } });
  if (!job || job.webhookToken !== token) return { status: 401 };
  if (job.status === "COMPLETED") return { status: 200 };

  const eventType = payload?.eventType as string | undefined;
  const resource = (payload?.resource ?? {}) as Record<string, unknown>;
  const datasetId = resource?.defaultDatasetId as string | undefined;

  if (eventType === "ACTOR.RUN.FAILED" || !datasetId) {
    await db.collectionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: "Run da Apify falhou ou sem dataset.",
        finishedAt: new Date(),
      },
    });
    return { status: 200 };
  }

  try {
    if (!job.competitorId) throw new Error("Job sem competitor.");
    const competitor = await db.competitor.findUnique({
      where: { id: job.competitorId },
    });
    if (!competitor) throw new Error("Competitor não encontrado.");

    const result = await getCollector().fetchRunResult(
      datasetId,
      competitor.handle,
      MAX_POSTS
    );
    const count = await persistCollectResult(competitor.id, result);

    await db.collectionJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", itemsCollected: count, finishedAt: new Date() },
    });
    return { status: 200 };
  } catch (e) {
    await db.collectionJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: String(e), finishedAt: new Date() },
    });
    return { status: 200 };
  }
}
