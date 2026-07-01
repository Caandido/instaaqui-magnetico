"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { getOrgLimits } from "@/lib/plan";

function str(formData: FormData, key: string): string {
  return (formData.get(key) ?? "").toString().trim();
}

// Salva os dados da empresa (nicho, perfil próprio, objetivo).
export async function saveCompanyInfo(formData: FormData) {
  const ws = await getWorkspace();
  if (!ws) return;
  const name = str(formData, "name");
  await db.project.update({
    where: { id: ws.project.id },
    data: {
      name: name || ws.project.name,
      niche: str(formData, "niche") || null,
      handle: str(formData, "handle") || null,
      objective: str(formData, "objective") || null,
    },
  });
  revalidatePath("/empresa");
}

// Adiciona concorrentes (respeita o limite do plano).
export async function addCompetitors(formData: FormData) {
  const ws = await getWorkspace();
  if (!ws) return;

  const handles = Array.from(
    new Set(
      str(formData, "competitors")
        .split(/[\n,]+/)
        .map((h) => h.trim().replace(/^@/, "").toLowerCase())
        .filter(Boolean)
    )
  );
  if (handles.length === 0) return;

  const limits = await getOrgLimits(ws.org.id);
  const existing = await db.competitor.count({
    where: { projectId: ws.project.id },
  });
  const room = Math.max(0, limits.maxCompetitorsPerProject - existing);
  if (room <= 0) {
    return; // limite atingido — a UI já avisa
  }

  for (const h of handles.slice(0, room)) {
    await db.competitor.upsert({
      where: { projectId_handle: { projectId: ws.project.id, handle: h } },
      create: { projectId: ws.project.id, handle: h },
      update: {},
    });
  }
  revalidatePath("/empresa");
}

// Remove um concorrente do workspace.
export async function removeCompetitor(formData: FormData) {
  const ws = await getWorkspace();
  if (!ws) return;
  const id = str(formData, "id");
  if (!id) return;
  await db.competitor.deleteMany({
    where: { id, projectId: ws.project.id },
  });
  revalidatePath("/empresa");
}
