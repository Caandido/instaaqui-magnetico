import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";

export default async function RoteirosPage() {
  const ws = await requireWorkspace();
  const scripts = await db.script.findMany({
    where: { projectId: ws.project.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Section title="Roteiros gerados" count={scripts.length}>
      {scripts.length === 0 ? (
        <EmptyState>Nenhum roteiro ainda. Rode uma análise em Visão geral.</EmptyState>
      ) : (
        <div className="space-y-3">
          {scripts.map((s) => {
            const full = `Objetivo: ${s.objective}\nGancho: ${s.hook}\n\n${s.scenes}\n\nCTA: ${s.cta}\nLegenda: ${s.caption}`;
            return (
              <div key={s.id} className="card p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">Objetivo: {s.objective}</p>
                  <CopyButton text={full} label="Copiar roteiro" />
                </div>
                <p className="text-neutral-300">Gancho: {s.hook}</p>
                <p className="mt-1 whitespace-pre-line text-neutral-300">{s.scenes}</p>
                <p className="mt-1 text-neutral-300">CTA: {s.cta}</p>
                <p className="mt-1 text-neutral-400">Legenda: {s.caption}</p>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
