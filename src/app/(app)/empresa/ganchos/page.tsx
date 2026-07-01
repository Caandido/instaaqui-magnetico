import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, EmptyState } from "@/components/ui";

export default async function GanchosPage() {
  const ws = await requireWorkspace();
  const insights = await db.insight.findMany({
    where: { projectId: ws.project.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Section title="Ganchos e engenharia reversa" count={insights.length}>
      {insights.length === 0 ? (
        <EmptyState>Nenhum insight ainda. Rode uma análise em Visão geral.</EmptyState>
      ) : (
        <div className="space-y-2">
          {insights.map((i) => (
            <div key={i.id} className="card p-4 text-sm">
              <p className="font-medium text-brand-300">Gancho: {i.hook}</p>
              {i.narrative && <p className="text-neutral-400">Narrativa: {i.narrative}</p>}
              <p className="text-neutral-300">Desenvolvimento: {i.development}</p>
              <p className="text-neutral-300">CTA: {i.cta}</p>
              <p className="text-neutral-200">
                <span className="font-medium">Por que funciona:</span> {i.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
