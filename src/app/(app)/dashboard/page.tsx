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
        <p className="text-neutral-300">
          Bem-vindo(a){data.user.name ? `, ${data.user.name}` : ""}! Sua fundação
          está pronta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h2 className="text-sm font-medium text-neutral-400">Workspace ativo</h2>
          <p className="mt-1 text-lg font-semibold">{activeOrg?.name ?? "—"}</p>
          <p className="text-xs text-neutral-500">Seu papel: {activeOrg?.role ?? "—"}</p>
        </div>
        <a
          href="/empresa"
          className="card card-hover p-5"
        >
          <h2 className="text-sm font-medium text-neutral-400">Sua empresa</h2>
          <p className="mt-1 text-neutral-200">
            Concorrentes, coletas, análises, alertas e ideias — tudo em um só lugar →
          </p>
        </a>
      </div>

      <div className="rounded-lg border border-dashed border-white/15 bg-white/5 backdrop-blur-sm p-5 text-sm text-neutral-400">
        Toda a inteligência de conteúdo da empresa fica reunida em{" "}
        <a href="/empresa" className="text-brand-400 hover:underline">
          Empresa
        </a>
        .
      </div>
    </div>
  );
}
