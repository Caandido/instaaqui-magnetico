import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { Section, EmptyState } from "@/components/ui";
import type { ReportResult } from "@/lib/ai/schemas";

export default async function RelatoriosPage() {
  const ws = await requireWorkspace();
  const report = await db.report.findFirst({
    where: { projectId: ws.project.id },
    orderBy: { createdAt: "desc" },
  });

  if (!report) {
    return (
      <Section title="Relatório">
        <EmptyState>
          Nenhum relatório ainda. Rode uma análise em Visão geral para gerar o
          relatório e o plano de 7 dias.
        </EmptyState>
      </Section>
    );
  }

  const rep = report.payload as unknown as ReportResult;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Relatório</h1>
        <p className="text-sm text-neutral-500">
          Gerado em {report.createdAt.toLocaleString("pt-BR")} · {report.type}
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Resumo executivo</h2>
        <p className="whitespace-pre-line text-neutral-200">{rep.summary}</p>
      </div>

      {rep.winningHooks?.length > 0 && (
        <Section title="Ganchos vencedores">
          <ul className="card list-inside list-disc space-y-1 p-5 text-sm text-neutral-200">
            {rep.winningHooks.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </Section>
      )}

      {rep.strategicAlerts?.length > 0 && (
        <Section title="Alertas do relatório">
          <div className="space-y-2">
            {rep.strategicAlerts.map((a, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
              >
                <p className="font-semibold text-amber-300">🚨 {a.type}</p>
                <p className="text-amber-300">{a.description}</p>
                <p className="mt-1 text-amber-400">
                  <span className="font-medium">Impacto:</span> {a.impact}
                </p>
                <p className="text-amber-400">
                  <span className="font-medium">Ação:</span> {a.action}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {rep.sevenDayPlan?.length > 0 && (
        <Section title="Plano de conteúdo — próximos 7 dias">
          <div className="card divide-y divide-white/10 p-5">
            {rep.sevenDayPlan.map((d, i) => (
              <div key={i} className="py-2 text-sm">
                <span className="font-semibold text-brand-300">Dia {d.day}</span> ·{" "}
                <span className="text-neutral-400">{d.format}</span> — {d.theme}
                <p className="text-neutral-300">Gancho: {d.hook}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
