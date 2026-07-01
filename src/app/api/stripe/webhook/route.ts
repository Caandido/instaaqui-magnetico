// Recebe eventos do Stripe e mantém a Subscription do banco em dia.
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe, planForPriceId } from "@/lib/stripe";
import type { SubscriptionStatus } from "@prisma/client";

export const runtime = "nodejs";

function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "ACTIVE";
  }
}

async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const organizationId = sub.metadata?.organizationId;
  if (!organizationId) return;
  const priceId = sub.items.data[0]?.price?.id;
  const plan = planForPriceId(priceId);
  const periodEnd = (sub as unknown as { current_period_end?: number })
    .current_period_end;

  await db.subscription.updateMany({
    where: { organizationId },
    data: {
      plan: plan ?? undefined,
      status: mapStatus(sub.status),
      stripeCustomerId:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
    },
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurado." },
      { status: 400 }
    );
  }

  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig ?? "", secret);
  } catch (e) {
    return NextResponse.json({ error: `Assinatura inválida: ${e}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe().subscriptions.retrieve(subId);
          // Garante o organizationId na assinatura (vem do checkout).
          if (!sub.metadata?.organizationId && session.metadata?.organizationId) {
            sub.metadata = {
              ...sub.metadata,
              organizationId: session.metadata.organizationId,
            };
          }
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
