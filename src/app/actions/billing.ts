"use server";

import { redirect } from "next/navigation";
import type { Plan } from "@prisma/client";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";
import { getBaseUrl } from "@/lib/app-url";
import { createCheckoutSession, stripeEnabled } from "@/lib/stripe";

// Inicia o checkout do Stripe para o plano escolhido e redireciona.
export async function startCheckout(formData: FormData): Promise<void> {
  const plan = formData.get("plan") as Plan | null;
  if (plan !== "PRO" && plan !== "AGENCY") {
    throw new Error("Plano inválido.");
  }
  if (!stripeEnabled()) {
    throw new Error("Cobrança ainda não configurada (STRIPE_SECRET_KEY).");
  }

  const data = await getCurrentUserWithOrgs();
  if (!data) redirect("/login");
  const activeOrg = await getActiveOrg(data.orgs);
  if (!activeOrg) throw new Error("Nenhuma organização ativa.");

  const base = getBaseUrl();
  const url = await createCheckoutSession({
    organizationId: activeOrg.id,
    plan,
    customerEmail: data.user.email ?? undefined,
    successUrl: `${base}/planos?sucesso=1`,
    cancelUrl: `${base}/planos?cancelado=1`,
  });

  redirect(url);
}
