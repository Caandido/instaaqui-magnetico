// Renderização (apresentacional) dos resultados da análise de IA.
// Recebe os dados já carregados e mostra alertas, resumo, tendências, ganchos,
// ideias, roteiros e gaps. Usado no espaço unificado da empresa.

import type {
  Idea,
  Script,
  Gap,
  Trend,
  Insight,
  Report,
  Alert,
  AnalysisRun,
} from "@prisma/client";
import type { ReportResult } from "@/lib/ai/schemas";

function PotentialBadge({ potential }: { potential: string }) {
  const color =
    potential === "ALTO"
      ? "bg-brand-500/15 text-brand-300"
      : potential === "BAIXO"
        ? "bg-neutral-800 text-neutral-300"
        : "bg-amber-500/15 text-amber-300";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {potential}
    </span>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        {title}
        {count != null && (
          <span className="ml-2 text-sm font-normal text-neutral-500">({count})</span>
        )}
      </h2>
      {children}
    </section>
  );
}

export function AnalysisResults({
  ideas,
  scripts,
  gaps,
  trends,
  insights,
  report,
  alerts,
  lastRun,
}: {
  ideas: Idea[];
  scripts: Script[];
  gaps: Gap[];
  trends: Trend[];
  insights: Insight[];
  report: Report | null;
  alerts: Alert[];
  lastRun: AnalysisRun | null;
}) {
  const rep = report?.payload as unknown as ReportResult | undefined;
  const hasAnything =
    ideas.length ||
    scripts.length ||
    gaps.length ||
    trends.length ||
    alerts.length ||
    report;

  if (!hasAnything) {
    return (
      <p className="rounded-lg border border-dashed border-white/15 bg-white/5 backdrop-blur-sm p-5 text-sm text-neutral-400">
        Nenhuma análise ainda. Adicione concorrentes, colete os conteúdos e
        clique em “Analisar com IA”.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {lastRun?.finishedAt && (
        <p className="text-sm text-neutral-500">
          Última análise: {lastRun.finishedAt.toLocaleString("pt-BR")} ·{" "}
          {lastRun.status}
        </p>
      )}

      {/* Alertas estratégicos */}
      {alerts.length > 0 && (
        <Section title="Alertas estratégicos" count={alerts.length}>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm"
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
        </Section>
      )}

      {/* Resumo executivo + plano de 7 dias */}
      {rep && (
        <Section title="Resumo estratégico">
          <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-5">
            <p className="whitespace-pre-line text-neutral-200">{rep.summary}</p>
          </div>

          {rep.winningHooks?.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-5">
              <h3 className="mb-2 text-sm font-medium text-neutral-400">
                Ganchos vencedores
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-neutral-200">
                {rep.winningHooks.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {rep.strategicAlerts?.length > 0 && (
            <div className="space-y-2">
              {rep.strategicAlerts.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
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
          )}

          {rep.sevenDayPlan?.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-5">
              <h3 className="mb-3 text-sm font-medium text-neutral-400">
                Plano de conteúdo — próximos 7 dias
              </h3>
              <ul className="divide-y divide-white/10">
                {rep.sevenDayPlan.map((d, i) => (
                  <li key={i} className="py-2 text-sm">
                    <span className="font-semibold">Dia {d.day}</span> ·{" "}
                    <span className="text-neutral-400">{d.format}</span> — {d.theme}
                    <p className="text-neutral-300">Gancho: {d.hook}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Tendências */}
      {trends.length > 0 && (
        <Section title="Tendências detectadas" count={trends.length}>
          <div className="grid gap-3 sm:grid-cols-2">
            {trends.map((t) => (
              <div key={t.id} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <p className="text-xs uppercase tracking-wide text-brand-400">
                  {t.kind}
                </p>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-neutral-300">{t.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ganchos / Insights */}
      {insights.length > 0 && (
        <Section title="Ganchos e engenharia reversa" count={insights.length}>
          <div className="space-y-2">
            {insights.map((i) => (
              <div key={i.id} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-sm">
                <p className="font-medium">Gancho: {i.hook}</p>
                {i.narrative && (
                  <p className="text-neutral-400">Narrativa: {i.narrative}</p>
                )}
                <p className="text-neutral-300">Desenvolvimento: {i.development}</p>
                <p className="text-neutral-300">CTA: {i.cta}</p>
                <p className="text-neutral-200">
                  <span className="font-medium">Por que funciona:</span> {i.reason}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ideias */}
      {ideas.length > 0 && (
        <Section title="Novas ideias" count={ideas.length}>
          <div className="grid gap-3 sm:grid-cols-2">
            {ideas.map((idea) => (
              <div key={idea.id} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4">
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
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Roteiros */}
      {scripts.length > 0 && (
        <Section title="Roteiros gerados" count={scripts.length}>
          <div className="space-y-3">
            {scripts.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-sm">
                <p className="font-medium">Objetivo: {s.objective}</p>
                <p className="text-neutral-300">Gancho: {s.hook}</p>
                <p className="mt-1 whitespace-pre-line text-neutral-300">{s.scenes}</p>
                <p className="mt-1 text-neutral-300">CTA: {s.cta}</p>
                <p className="mt-1 text-neutral-400">Legenda: {s.caption}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Gaps */}
      {gaps.length > 0 && (
        <Section title="Gaps encontrados" count={gaps.length}>
          <div className="grid gap-3 sm:grid-cols-2">
            {gaps.map((g) => (
              <div key={g.id} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{g.theme}</p>
                  <PotentialBadge potential={g.potential} />
                </div>
                <p className="mt-1 text-sm text-neutral-300">{g.reason}</p>
                <p className="text-sm text-neutral-200">
                  <span className="font-medium">Recomendação:</span>{" "}
                  {g.recommendation}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
