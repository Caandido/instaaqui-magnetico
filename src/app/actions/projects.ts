"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";
import { checkCanCreateProject, getOrgLimits } from "@/lib/plan";

export async function createProject(formData: FormData) {
  const data = await getCurrentUserWithOrgs();
  if (!data) return;
  const activeOrg = await getActiveOrg(data.orgs);
  if (!activeOrg) return;

  // Limite de projetos por plano (Fase 3).
  const limitMsg = await checkCanCreateProject(activeOrg.id);
  if (limitMsg) redirect("/planos?limite=projetos");
  const limits = await getOrgLimits(activeOrg.id);

  const name = (formData.get("name") ?? "").toString().trim();
  const niche = (formData.get("niche") ?? "").toString().trim();
  const handle = (formData.get("handle") ?? "").toString().trim();
  const objective = (formData.get("objective") ?? "").toString().trim();
  const competitorsRaw = (formData.get("competitors") ?? "").toString();

  if (!name) return;

  const handles = Array.from(
    new Set(
      competitorsRaw
        .split(/[\n,]+/)
        .map((h) => h.trim().replace(/^@/, "").toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, limits.maxCompetitorsPerProject); // respeita o limite do plano

  await db.project.create({
    data: {
      name,
      niche: niche || null,
      handle: handle || null,
      objective: objective || null,
      organizationId: activeOrg.id,
      competitors: { create: handles.map((h) => ({ handle: h })) },
    },
  });

  redirect("/projetos");
}
