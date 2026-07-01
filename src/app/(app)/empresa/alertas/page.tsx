import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, EmptyState } from "@/components/ui";

export default async function AlertasPage() {
  const ws = await requireWorkspace();
  const alerts = await db.alert.findMany({
    where: { projectId: ws.project.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Section title="Alertas estratégicos" count={alerts.length}>
      {alerts.length === 0 ? (
        <EmptyState>
          Nenhum alerta ainda. Os alertas aparecem após uma análise (novo viral,
          tendências emergentes).
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm"
            >
              <p className="font-semibold text-red-300">
                🚨 {a.type.replace(/_/g, " ")}
                {a.competitor ? ` · @${a.competitor}` : ""}
              </p>
              <p className="text-red-300">{a.description}</p>
              <p className="mt-1 text-red-400">
                <span className="font-medium">Impacto:</span> {a.impact}
              </p>
              <p className="text-red-400">
                <span className="font-medium">Ação:</span> {a.action}
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
