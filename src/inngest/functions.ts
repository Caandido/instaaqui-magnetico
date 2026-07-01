// Tarefas agendadas (Fase 3). O agendador é só o "despertador" que aciona o
// que já existe: o pipeline de IA da Fase 2 (que também gera alertas).
//
// NOTA: cada análise roda em um step único (chama runAnalysisForProject, ~5
// chamadas ao Claude). Em projetos MUITO grandes isso pode se aproximar do
// limite de tempo do serverless (60s no plano Free do Vercel). Endurecimento
// futuro: quebrar cada agente em seu próprio step.run().

import { inngest } from "./client";
import { db } from "@/lib/db";
import { runAnalysisForProject } from "@/lib/ai/pipeline";
import { getOrgPlan, PLAN_LIMITS } from "@/lib/plan";

// Roda a análise de UM projeto (disparado por evento — fan-out por projeto).
export const runScheduledAnalysis = inngest.createFunction(
  { id: "run-scheduled-analysis", retries: 1, triggers: [{ event: "analysis/run" }] },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };
    return step.run("analyze", () => runAnalysisForProject(projectId));
  }
);

// Lista os projetos cujo plano permite análise agendada.
async function eligibleProjectIds(): Promise<string[]> {
  const projects = await db.project.findMany({
    select: { id: true, organizationId: true },
  });
  const ids: string[] = [];
  for (const p of projects) {
    const plan = await getOrgPlan(p.organizationId);
    if (PLAN_LIMITS[plan].scheduledAnalysis) ids.push(p.id);
  }
  return ids;
}

// Relatório DIÁRIO — todo dia às 9h (UTC).
export const dailyReports = inngest.createFunction(
  { id: "daily-reports", triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const ids = await step.run("eligible", eligibleProjectIds);
    await Promise.all(
      ids.map((projectId) =>
        step.sendEvent(`send-${projectId}`, {
          name: "analysis/run",
          data: { projectId },
        })
      )
    );
    return { triggered: ids.length };
  }
);

// Relatório SEMANAL — toda segunda-feira às 9h (UTC).
export const weeklyReports = inngest.createFunction(
  { id: "weekly-reports", triggers: [{ cron: "0 9 * * 1" }] },
  async ({ step }) => {
    const ids = await step.run("eligible-weekly", eligibleProjectIds);
    await Promise.all(
      ids.map((projectId) =>
        step.sendEvent(`send-week-${projectId}`, {
          name: "analysis/run",
          data: { projectId },
        })
      )
    );
    return { triggered: ids.length };
  }
);
