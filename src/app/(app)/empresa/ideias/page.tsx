import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, PotentialBadge, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";

export default async function IdeiasPage() {
  const ws = await requireWorkspace();
  const ideas = await db.idea.findMany({
    where: { projectId: ws.project.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Section title="Novas ideias" count={ideas.length}>
      {ideas.length === 0 ? (
        <EmptyState>Nenhuma ideia ainda. Rode uma análise em Visão geral.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ideas.map((idea) => {
            const full = `${idea.title}\n\nGancho: ${idea.hook}\nEstrutura: ${idea.structure}\nCTA: ${idea.cta}`;
            return (
              <div key={idea.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{idea.title}</p>
                  <PotentialBadge potential={idea.potential} />
                </div>
                <p className="mt-1 text-sm text-neutral-300">
                  <span className="font-medium">Gancho:</span> {idea.hook}
                </p>
                <p className="text-sm text-neutral-300">
                  <span className="font-medium">Estrutura:</span> {idea.structure}
                </p>
                <p className="text-sm text-neutral-300">
                  <span className="font-medium">CTA:</span> {idea.cta}
                </p>
                <div className="mt-3">
                  <CopyButton text={full} label="Copiar ideia" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
