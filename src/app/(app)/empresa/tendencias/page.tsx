import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, EmptyState } from "@/components/ui";

export default async function TendenciasPage() {
  const ws = await requireWorkspace();
  const trends = await db.trend.findMany({
    where: { projectId: ws.project.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Section title="Radar de tendências" count={trends.length}>
      {trends.length === 0 ? (
        <EmptyState>Nenhuma tendência ainda. Rode uma análise em Visão geral.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {trends.map((t) => (
            <div key={t.id} className="card p-4">
              <p className="text-xs uppercase tracking-wide text-brand-400">{t.kind}</p>
              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-neutral-300">{t.description}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
