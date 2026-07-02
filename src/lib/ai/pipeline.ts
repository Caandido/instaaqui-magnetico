// Orquestra os agentes na ordem certa e salva os resultados no banco.
// Ordem: (classificar + viralização + trends em paralelo) → gaps → copy → relatório.

import { db } from "@/lib/db";
import { topPosts, type PostLite } from "./context";

// Máximo de posts enviados à IA por análise. Foca nos de maior engajamento e
// mantém cada chamada dentro do limite de entrada do modelo gratuito.
const MAX_POSTS_ANALYZED = 20;
import { classifyPosts } from "./classificador";
import { analyzeVirality } from "./viralizacao";
import { huntTrends } from "./trend-hunter";
import { findGaps } from "./estrategista";
import { generateCopy } from "./copywriter";
import { generateReport } from "./report-generator";
import { detectAlerts } from "@/lib/alerts";

export type PipelineSummary = {
  runId: string;
  contents: number;
  classifications: number;
  insights: number;
  ideas: number;
  scripts: number;
  gaps: number;
  trends: number;
  report: boolean;
  alerts: number;
};

export async function runAnalysisForProject(
  projectId: string
): Promise<PipelineSummary> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      competitors: {
        include: {
          contents: {
            orderBy: { postedAt: "desc" },
            take: 40,
          },
        },
      },
    },
  });
  if (!project) throw new Error("Projeto não encontrado.");

  // Achata os posts coletados em uma lista compacta + mapa externalId → contentId.
  const allPosts: PostLite[] = [];
  const contentIdByExternal = new Map<string, string>();
  for (const c of project.competitors) {
    for (const ct of c.contents) {
      allPosts.push({
        externalId: ct.externalId,
        competitor: c.handle,
        type: ct.type,
        caption: ct.caption ?? "",
        likes: ct.likes ?? 0,
        comments: ct.comments ?? 0,
        views: ct.views ?? 0,
      });
      contentIdByExternal.set(ct.externalId, ct.id);
    }
  }
  // Analisa os de maior engajamento (limite de entrada do modelo gratuito).
  const posts = topPosts(allPosts, MAX_POSTS_ANALYZED);

  const run = await db.analysisRun.create({
    data: { projectId, status: "RUNNING", contentsSeen: allPosts.length },
  });

  try {
    if (allPosts.length === 0) {
      throw new Error(
        "Nenhum conteúdo coletado. Rode a coleta (Fase 1) antes de analisar."
      );
    }

    const ctx = {
      name: project.name,
      niche: project.niche,
      handle: project.handle,
      objective: project.objective,
    };

    // Limpa resultados anteriores deste projeto (análise sempre "fresca").
    await clearPreviousResults(projectId);

    // --- Onda 1: agentes que dependem só do conteúdo (em paralelo) ---------
    const [classification, insights, trends] = await Promise.all([
      classifyPosts(posts),
      analyzeVirality(ctx, posts),
      huntTrends(ctx, posts),
    ]);

    // --- Onda 2: gaps (dependem dos insights) ------------------------------
    const gaps = await findGaps(ctx, posts, insights);

    // --- Onda 3: ideias + roteiros (dependem de insights e gaps) -----------
    const copy = await generateCopy(ctx, insights, gaps);

    // --- Onda 4: relatório consolidado -------------------------------------
    const report = await generateReport(ctx, { insights, gaps, trends, copy });

    // --- Persistência ------------------------------------------------------
    let classCount = 0;
    for (const item of classification.items) {
      const contentId = contentIdByExternal.get(item.externalId);
      if (!contentId) continue;
      await db.classification.create({
        data: {
          contentId,
          category: item.category,
          format: item.format,
          objective: item.objective,
        },
      });
      classCount++;
    }

    if (insights.insights.length > 0) {
      await db.insight.createMany({
        data: insights.insights.map((i) => ({
          projectId,
          contentId: i.externalId
            ? contentIdByExternal.get(i.externalId) ?? null
            : null,
          hook: i.hook,
          development: i.development,
          cta: i.cta,
          narrative: i.narrative,
          reason: i.reason,
        })),
      });
    }

    if (trends.trends.length > 0) {
      await db.trend.createMany({
        data: trends.trends.map((t) => ({
          projectId,
          kind: t.kind,
          title: t.title,
          description: t.description,
        })),
      });
    }

    if (gaps.gaps.length > 0) {
      await db.gap.createMany({
        data: gaps.gaps.map((g) => ({
          projectId,
          theme: g.theme,
          reason: g.reason,
          potential: g.potential,
          recommendation: g.recommendation,
        })),
      });
    }

    if (copy.ideas.length > 0) {
      await db.idea.createMany({
        data: copy.ideas.map((i) => ({
          projectId,
          title: i.title,
          hook: i.hook,
          structure: i.structure,
          cta: i.cta,
          potential: i.potential,
        })),
      });
    }

    if (copy.scripts.length > 0) {
      await db.script.createMany({
        data: copy.scripts.map((s) => ({
          projectId,
          objective: s.objective,
          hook: s.hook,
          scenes: s.scenes,
          cta: s.cta,
          caption: s.caption,
        })),
      });
    }

    await db.report.create({
      data: {
        projectId,
        type: "DIARIO",
        summary: report.summary,
        payload: report,
      },
    });

    // Alertas estratégicos (Fase 3) — depois que trends/contents estão salvos.
    const alertsCount = await detectAlerts(projectId);

    await db.analysisRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        ideasCount: copy.ideas.length,
        insightsCount: insights.insights.length,
      },
    });

    return {
      runId: run.id,
      contents: allPosts.length,
      classifications: classCount,
      insights: insights.insights.length,
      ideas: copy.ideas.length,
      scripts: copy.scripts.length,
      gaps: gaps.gaps.length,
      trends: trends.trends.length,
      report: true,
      alerts: alertsCount,
    };
  } catch (e) {
    await db.analysisRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: String(e), finishedAt: new Date() },
    });
    throw e;
  }
}

// Remove resultados de análises anteriores (mantém o projeto idempotente).
async function clearPreviousResults(projectId: string): Promise<void> {
  await db.classification.deleteMany({
    where: { content: { competitor: { projectId } } },
  });
  await db.insight.deleteMany({ where: { projectId } });
  await db.idea.deleteMany({ where: { projectId } });
  await db.script.deleteMany({ where: { projectId } });
  await db.gap.deleteMany({ where: { projectId } });
  await db.trend.deleteMany({ where: { projectId } });
  await db.report.deleteMany({ where: { projectId } });
}
