import { redirect } from "next/navigation";
import type { Plan } from "@prisma/client";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";
import { getOrgPlan, PLAN_LIMITS } from "@/lib/plan";
import { stripeEnabled } from "@/lib/stripe";
import { startCheckout } from "@/app/actions/billing";

const PLAN_INFO: { plan: Plan; name: string; price: string; highlight?: boolean }[] = [
  { plan: "FREE", name: "Free", price: "R$ 0" },
  { plan: "PRO", name: "Pro", price: "R$ 97/mês", highlight: true },
  { plan: "AGENCY", name: "Agência", price: "R$ 297/mês" },
];

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ sucesso?: string; cancelado?: string }>;
}) {
  const sp = await searchParams;
  const data = await getCurrentUserWithOrgs();
  if (!data) redirect("/login");
  const activeOrg = await getActiveOrg(data.orgs);
  if (!activeOrg) return null;

  const currentPlan = await getOrgPlan(activeOrg.id);
  const canCheckout = stripeEnabled();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Planos</h1>
        <p className="text-neutral-300">
          Seu plano atual: <span className="font-medium">{currentPlan}</span>
        </p>
      </div>

      {sp.sucesso && (
        <p className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-300">
          Assinatura confirmada! Pode levar alguns segundos para o plano atualizar.
        </p>
      )}
      {sp.cancelado && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Checkout cancelado. Nenhuma cobrança foi feita.
        </p>
      )}
      {!canCheckout && (
        <p className="rounded-lg border border-dashed border-white/15 bg-white/5 backdrop-blur-sm p-4 text-sm text-neutral-400">
          Cobrança em modo de configuração: defina as chaves do Stripe
          (STRIPE_SECRET_KEY e preços) no Vercel para habilitar os upgrades.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        {PLAN_INFO.map(({ plan, name, price, highlight }) => {
          const limits = PLAN_LIMITS[plan];
          const isCurrent = plan === currentPlan;
          return (
            <div
              key={plan}
              className={`card card-hover p-5 ${
                highlight ? "border-brand-500/40 ring-1 ring-brand-500/20" : ""
              }`}
            >
              <h2 className="text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-2xl font-bold">{price}</p>
              <ul className="mt-4 space-y-1 text-sm text-neutral-300">
                <li>{limits.maxProjects} projeto(s)</li>
                <li>{limits.maxCompetitorsPerProject} concorrentes por projeto</li>
                <li>
                  {limits.scheduledAnalysis
                    ? "Análise automática agendada"
                    : "Análise manual"}
                </li>
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <span className="inline-block rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-400">
                    Plano atual
                  </span>
                ) : plan === "FREE" ? (
                  <span className="text-sm text-neutral-500">—</span>
                ) : (
                  <form action={startCheckout}>
                    <input type="hidden" name="plan" value={plan} />
                    <button
                      type="submit"
                      disabled={!canCheckout}
                      className="btn-primary w-full"
                    >
                      Assinar {name}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
