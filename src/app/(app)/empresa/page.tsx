import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { getOrgLimits } from "@/lib/plan";
import {
  saveCompanyInfo,
  addCompetitors,
  removeCompetitor,
} from "@/app/actions/company";
import { CollectButton } from "@/components/collect-button";
import { AnalyzeButton } from "@/components/analyze-button";
import { StatCard } from "@/components/ui";

export default async function EmpresaPage() {
  const ws = await requireWorkspace();
  const projectId = ws.project.id;
  const limits = await getOrgLimits(ws.org.id);

  const [
    competitors,
    ideas,
    scripts,
    gaps,
    trends,
    insights,
    alerts,
    contents,
    lastRun,
  ] = await Promise.all([
    db.competitor.findMany({
      where: { projectId },
      orderBy: { handle: "asc" },
      include: { _count: { select: { contents: true } } },
    }),
    db.idea.count({ where: { projectId } }),
    db.script.count({ where: { projectId } }),
    db.gap.count({ where: { projectId } }),
    db.trend.count({ where: { projectId } }),
    db.insight.count({ where: { projectId } }),
    db.alert.count({ where: { projectId } }),
    db.content.count({ where: { competitor: { projectId } } }),
    db.analysisRun.findFirst({ where: { projectId }, orderBy: { startedAt: "desc" } }),
  ]);

  const totalContents = competitors.reduce((acc, c) => acc + c._count.contents, 0);
  const atLimit = competitors.length >= limits.maxCompetitorsPerProject;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Sua empresa</h1>
        <p className="text-neutral-400">
          Tudo em um só lugar: concorrentes, coletas, análises, alertas e ideias.
        </p>
      </div>

      {/* Painel resumo → atalhos para os dashboards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Conteúdos" value={contents} href="/empresa/conteudos" />
        <StatCard label="Tendências" value={trends} href="/empresa/tendencias" />
        <StatCard label="Ideias" value={ideas} href="/empresa/ideias" />
        <StatCard label="Roteiros" value={scripts} href="/empresa/roteiros" />
        <StatCard label="Gaps" value={gaps} href="/empresa/gaps" />
        <StatCard label="Alertas" value={alerts} href="/empresa/alertas" />
      </div>
      {lastRun?.finishedAt && (
        <p className="-mt-4 text-xs text-neutral-500">
          Última análise: {lastRun.finishedAt.toLocaleString("pt-BR")} ·{" "}
          {lastRun.status} · {insights} insights
        </p>
      )}

      {/* Dados da empresa */}
      <form action={saveCompanyInfo} className="card grid gap-4 p-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-200">
            Nome da empresa
          </span>
          <input name="name" defaultValue={ws.project.name} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-200">Nicho</span>
          <input
            name="niche"
            defaultValue={ws.project.niche ?? ""}
            className="input"
            placeholder="Ex.: Marketing Digital"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-200">
            Seu perfil (@)
          </span>
          <input
            name="handle"
            defaultValue={ws.project.handle ?? ""}
            className="input"
            placeholder="@suaempresa"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-200">Objetivo</span>
          <input
            name="objective"
            defaultValue={ws.project.objective ?? ""}
            className="input"
            placeholder="Ex.: gerar mais leads"
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-secondary">
            Salvar dados da empresa
          </button>
        </div>
      </form>

      {/* Concorrentes */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Concorrentes monitorados{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({competitors.length}/{limits.maxCompetitorsPerProject}) ·{" "}
              {totalContents} conteúdo(s)
            </span>
          </h2>
          <div className="flex flex-col items-end gap-2">
            <CollectButton projectId={projectId} />
            <AnalyzeButton projectId={projectId} />
          </div>
        </div>

        {competitors.length > 0 && (
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {competitors.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium">@{c.handle}</span>
                <span className="flex items-center gap-3 text-neutral-400">
                  {c.followers != null
                    ? `${c.followers.toLocaleString("pt-BR")} seguidores · `
                    : ""}
                  {c._count.contents} post(s)
                  {c.lastCollectedAt ? " · coletado ✓" : " · não coletado"}
                  <form action={removeCompetitor}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-red-400 hover:underline">
                      remover
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form action={addCompetitors} className="mt-4 space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-200">
              Adicionar concorrentes (um por linha ou separados por vírgula)
            </span>
            <textarea
              name="competitors"
              rows={2}
              disabled={atLimit}
              className="input"
              placeholder="@concorrente1&#10;@concorrente2"
            />
          </label>
          <button type="submit" disabled={atLimit} className="btn-primary">
            Adicionar
          </button>
          {atLimit && (
            <span className="ml-3 text-sm text-neutral-400">
              Limite de {limits.maxCompetitorsPerProject} concorrentes atingido.
              Remova algum para adicionar outro.
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
