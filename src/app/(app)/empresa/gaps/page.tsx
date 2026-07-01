import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, PotentialBadge, EmptyState } from "@/components/ui";

export default async function GapsPage() {
  const ws = await requireWorkspace();
  const gaps = await db.gap.findMany({
    where: { projectId: ws.project.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Section title="Gaps (oportunidades)" count={gaps.length}>
      {gaps.length === 0 ? (
        <EmptyState>Nenhum gap ainda. Rode uma análise em Visão geral.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {gaps.map((g) => (
            <div key={g.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{g.theme}</p>
                <PotentialBadge potential={g.potential} />
              </div>
              <p className="mt-1 text-sm text-neutral-300">{g.reason}</p>
              <p className="text-sm text-neutral-200">
                <span className="font-medium">Recomendação:</span> {g.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
