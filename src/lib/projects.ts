// Helpers de acesso a projetos (garante que o projeto pertence ao usuário logado).
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getAccessibleProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: project.organizationId,
      },
    },
  });

  return membership ? project : null;
}
