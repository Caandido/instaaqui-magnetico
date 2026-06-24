import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const data = await getCurrentUserWithOrgs();
  if (!data) redirect("/login");
  const activeOrg = await getActiveOrg(data.orgs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-600">
          Bem-vindo(a){data.user.name ? `, ${data.user.name}` : ""}! Sua fundação
          está pronta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-medium text-gray-500">Workspace ativo</h2>
          <p className="mt-1 text-lg font-semibold">{activeOrg?.name ?? "—"}</p>
          <p className="text-xs text-gray-400">Seu papel: {activeOrg?.role ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-medium text-gray-500">Próximo passo</h2>
          <p className="mt-1 text-gray-700">
            Fase 1 — Coleta via Apify (criar projetos e concorrentes).
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
        As telas de projetos, concorrentes, tendências, ideias, roteiros, gaps,
        alertas e relatórios chegam nas próximas fases.
      </div>
    </div>
  );
}
