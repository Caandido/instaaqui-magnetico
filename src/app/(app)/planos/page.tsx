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
        <p className="text-gray-600">
          Seu plano atual: <span className="font-medium">{currentPlan}</span>
        </p>
      </div>

      {sp.sucesso && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Assinatura confirmada! Pode levar alguns segundos para o plano atualizar.
        </p>
      )}
      {sp.cancelado && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Checkout cancelado. Nenhuma cobrança foi feita.
        </p>
      )}
      {!canCheckout && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
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
              className={`rounded-lg border bg-white p-5 ${
                highlight ? "border-pink-300 ring-1 ring-pink-100" : "border-gray-200"
              }`}
            >
              <h2 className="text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-2xl font-bold">{price}</p>
              <ul className="mt-4 space-y-1 text-sm text-gray-600">
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
                  <span className="inline-block rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                    Plano atual
                  </span>
                ) : plan === "FREE" ? (
                  <span className="text-sm text-gray-400">—</span>
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
