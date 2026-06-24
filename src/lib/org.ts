// Helpers de multi-tenant: usuário atual + organização ativa.
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ACTIVE_ORG_COOKIE = "active_org";

export type OrgSummary = { id: string; name: string; slug: string; role: string };

// Retorna o usuário logado com suas organizações; null se não autenticado.
export async function getCurrentUserWithOrgs() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const orgs: OrgSummary[] = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));

  return {
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
    orgs,
  };
}

// Resolve a organização ativa: cookie válido -> senão a primeira do usuário.
export async function getActiveOrg(orgs: OrgSummary[]): Promise<OrgSummary | null> {
  if (orgs.length === 0) return null;
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const found = orgs.find((o) => o.id === selectedId);
  return found ?? orgs[0];
}

export { ACTIVE_ORG_COOKIE };
