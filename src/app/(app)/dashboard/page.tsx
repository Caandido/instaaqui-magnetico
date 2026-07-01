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
        <a
          href="/empresa"
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-brand-300"
        >
          <h2 className="text-sm font-medium text-gray-500">Sua empresa</h2>
          <p className="mt-1 text-gray-700">
            Concorrentes, coletas, análises, alertas e ideias — tudo em um só lugar →
          </p>
        </a>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
        Toda a inteligência de conteúdo da empresa fica reunida em{" "}
        <a href="/empresa" className="text-brand-700 hover:underline">
          Empresa
        </a>
        .
      </div>
    </div>
  );
}
