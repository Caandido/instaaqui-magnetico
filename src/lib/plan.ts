// Limites por plano de assinatura (Fase 3). Aplicados antes de criar projetos
// e concorrentes. Ajuste os números conforme sua estratégia de preços.

import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

export type PlanLimits = {
  maxProjects: number;
  maxCompetitorsPerProject: number;
  scheduledAnalysis: boolean; // agendamento automático liberado?
};

// Sem planos pagos: um único tier com limites de uso generosos.
// (Mantido como módulo interno de limites; o cap de concorrentes evita
//  estourar os créditos gratuitos da Apify.)
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { maxProjects: 1, maxCompetitorsPerProject: 15, scheduledAnalysis: true },
  PRO: { maxProjects: 1, maxCompetitorsPerProject: 15, scheduledAnalysis: true },
  AGENCY: { maxProjects: 1, maxCompetitorsPerProject: 15, scheduledAnalysis: true },
};

// Descobre o plano ativo de uma organização (default FREE).
export async function getOrgPlan(organizationId: string): Promise<Plan> {
  const sub = await db.subscription.findUnique({ where: { organizationId } });
  // Só considera pago se a assinatura estiver ativa/trial.
  if (sub && (sub.status === "ACTIVE" || sub.status === "TRIALING")) {
    return sub.plan;
  }
  return "FREE";
}

export async function getOrgLimits(organizationId: string): Promise<PlanLimits> {
  const plan = await getOrgPlan(organizationId);
  return PLAN_LIMITS[plan];
}

// Retorna null se pode criar projeto; senão uma mensagem de limite.
export async function checkCanCreateProject(
  organizationId: string
): Promise<string | null> {
  const limits = await getOrgLimits(organizationId);
  const count = await db.project.count({ where: { organizationId } });
  if (count >= limits.maxProjects) {
    return `Seu plano permite até ${limits.maxProjects} projeto(s). Faça upgrade para criar mais.`;
  }
  return null;
}
