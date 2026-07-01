import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, Badge, EmptyState } from "@/components/ui";

export default async function ConteudosPage() {
  const ws = await requireWorkspace();
  const contents = await db.content.findMany({
    where: { competitor: { projectId: ws.project.id } },
    include: { competitor: true, classification: true },
    take: 200,
  });

  const top = contents
    .map((c) => ({ c, eng: (c.likes ?? 0) + (c.comments ?? 0) * 3 }))
    .sort((a, b) => b.eng - a.eng)
    .slice(0, 40)
    .map((x) => x.c);

  return (
    <Section title="Top conteúdos" count={top.length}>
      {top.length === 0 ? (
        <EmptyState>
          Nenhum conteúdo coletado ainda. Vá em Visão geral e clique em “Coletar
          agora”.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {top.map((c) => (
            <div key={c.id} className="card p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">@{c.competitor.handle}</span>
                <span className="text-neutral-400">
                  {(c.likes ?? 0).toLocaleString("pt-BR")} ♥ ·{" "}
                  {(c.comments ?? 0).toLocaleString("pt-BR")} 💬
                </span>
              </div>
              {c.classification && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone="brand">{c.classification.category}</Badge>
                  <Badge>{c.classification.format}</Badge>
                  <Badge tone="amber">{c.classification.objective}</Badge>
                </div>
              )}
              {c.caption && (
                <p className="mt-2 line-clamp-3 text-neutral-300">{c.caption}</p>
              )}
              {c.url && (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-brand-400 hover:underline"
                >
                  ver no Instagram →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
