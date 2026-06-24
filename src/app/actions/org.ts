"use server";

// Server action: define a organização ativa (cookie) e recarrega.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACTIVE_ORG_COOKIE } from "@/lib/org";

export async function setActiveOrg(formData: FormData) {
  const orgId = (formData.get("orgId") ?? "").toString();
  const session = await auth();
  if (!session?.user?.id || !orgId) return;

  // Garante que o usuário pertence à organização escolhida.
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
