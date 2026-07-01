// Cobrança por assinatura (Stripe). Os IDs de preço vêm do painel do Stripe e
// são configurados por env. Sem STRIPE_SECRET_KEY, as funções lançam — a UI
// deve checar `stripeEnabled()` antes de oferecer upgrade.

import Stripe from "stripe";
import type { Plan } from "@prisma/client";

let _stripe: Stripe | null = null;

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado.");
  _stripe ??= new Stripe(key);
  return _stripe;
}

// Preço (Stripe) de cada plano pago, via env.
export function priceIdForPlan(plan: Plan): string | null {
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO ?? null;
  if (plan === "AGENCY") return process.env.STRIPE_PRICE_AGENCY ?? null;
  return null; // FREE não tem preço
}

// Descobre o plano a partir do priceId recebido no webhook.
export function planForPriceId(priceId: string | undefined | null): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "AGENCY";
  return null;
}

// Cria a sessão de checkout (assinatura) e devolve a URL para redirecionar.
export async function createCheckoutSession(opts: {
  organizationId: string;
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<string> {
  const price = priceIdForPlan(opts.plan);
  if (!price) throw new Error(`Plano ${opts.plan} sem preço configurado.`);

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: opts.customerEmail,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    // Amarramos a assinatura à Organization para o webhook saber quem atualizar.
    client_reference_id: opts.organizationId,
    metadata: { organizationId: opts.organizationId },
    subscription_data: { metadata: { organizationId: opts.organizationId } },
  });
  if (!session.url) throw new Error("Stripe não retornou a URL de checkout.");
  return session.url;
}
