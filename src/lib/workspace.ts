// Espaço único e unificado por empresa (organização). Em vez de vários
// "projetos", cada empresa tem UM workspace que concentra todo o conteúdo:
// concorrentes, coletas, análises e alertas. Por baixo ainda é um Project
// (para reaproveitar todo o motor das Fases 1–3), mas há só um por empresa.

import { db } from "@/lib/db";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";

export async function getWorkspace() {
  const data = await getCurrentUserWithOrgs();
  if (!data) return null;
  const org = await getActiveOrg(data.orgs);
  if (!org) return null;

  // O workspace é o Project mais antigo da empresa; cria um se não existir.
  let project = await db.project.findFirst({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
  });
  if (!project) {
    project = await db.project.create({
      data: { name: org.name, organizationId: org.id },
    });
  }

  return { project, org, user: data.user };
}
