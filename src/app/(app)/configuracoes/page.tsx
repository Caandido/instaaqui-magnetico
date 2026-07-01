import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { getOrgLimits } from "@/lib/plan";
import { Badge } from "@/components/ui";

export default async function ConfiguracoesPage() {
  const ws = await requireWorkspace();
  const limits = await getOrgLimits(ws.org.id);

  const members = await db.membership.findMany({
    where: { organizationId: ws.org.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-neutral-400">Organização, uso e equipe.</p>
      </div>

      {/* Uso */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold">Uso</h2>
        <ul className="mt-3 space-y-1 text-sm text-neutral-400">
          <li>Até {limits.maxCompetitorsPerProject} concorrentes monitorados</li>
          <li>
            {limits.scheduledAnalysis
              ? "Análise automática agendada"
              : "Análise manual"}
          </li>
        </ul>
      </div>

      {/* Organização */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold">Organização</h2>
        <p className="mt-1 text-sm text-neutral-300">
          Nome: <span className="font-medium">{ws.org.name}</span>
        </p>
        <p className="text-sm text-neutral-400">Seu papel: {ws.org.role}</p>
      </div>

      {/* Equipe */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold">
          Equipe{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({members.length})
          </span>
        </h2>
        <ul className="mt-3 divide-y divide-white/10 border-t border-white/10">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="text-neutral-200">
                {m.user.name ? `${m.user.name} · ` : ""}
                {m.user.email}
              </span>
              <Badge>{m.role}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          Convite de novos membros por e-mail chega em uma próxima atualização.
        </p>
      </div>
    </div>
  );
}
