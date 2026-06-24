"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";

export async function createProject(formData: FormData) {
  const data = await getCurrentUserWithOrgs();
  if (!data) return;
  const activeOrg = await getActiveOrg(data.orgs);
  if (!activeOrg) return;

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
  );

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
