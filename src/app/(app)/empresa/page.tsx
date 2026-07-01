import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { getOrgLimits } from "@/lib/plan";
import {
  saveCompanyInfo,
  addCompetitors,
  removeCompetitor,
} from "@/app/actions/company";
import { CollectButton } from "@/components/collect-button";
import { AnalyzeButton } from "@/components/analyze-button";
import { AnalysisResults } from "@/components/analysis-results";

export default async function EmpresaPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/login");

  const projectId = ws.project.id;
  const limits = await getOrgLimits(ws.org.id);

  const [competitors, ideas, scripts, gaps, trends, insights, report, lastRun, alerts] =
    await Promise.all([
      db.competitor.findMany({
        where: { projectId },
        orderBy: { handle: "asc" },
        include: { _count: { select: { contents: true } } },
      }),
      db.idea.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      db.script.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      db.gap.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      db.trend.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      db.insight.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      db.report.findFirst({ where: { projectId }, orderBy: { createdAt: "desc" } }),
      db.analysisRun.findFirst({ where: { projectId }, orderBy: { startedAt: "desc" } }),
      db.alert.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
    ]);

  const totalContents = competitors.reduce((acc, c) => acc + c._count.contents, 0);
  const atLimit = competitors.length >= limits.maxCompetitorsPerProject;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Sua empresa</h1>
        <p className="text-gray-600">
          Tudo em um só lugar: seus concorrentes, coletas, análises, alertas e
          ideias de conteúdo.
        </p>
      </div>

      {/* Dados da empresa */}
      <form
        action={saveCompanyInfo}
        className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Nome da empresa
          </span>
          <input
            name="name"
            defaultValue={ws.project.name}
            className="input"
            placeholder="Ex.: Minha Empresa"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Nicho</span>
          <input
            name="niche"
            defaultValue={ws.project.niche ?? ""}
            className="input"
            placeholder="Ex.: Marketing Digital"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
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
          <span className="mb-1 block text-sm font-medium text-gray-700">Objetivo</span>
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
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Concorrentes monitorados{" "}
            <span className="text-sm font-normal text-gray-400">
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
          <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
            {competitors.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium">@{c.handle}</span>
                <span className="flex items-center gap-3 text-gray-500">
                  {c.followers != null
                    ? `${c.followers.toLocaleString("pt-BR")} seguidores · `
                    : ""}
                  {c._count.contents} post(s)
                  {c.lastCollectedAt ? " · coletado ✓" : " · não coletado"}
                  <form action={removeCompetitor}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-red-600 hover:underline"
                      title="Remover"
                    >
                      remover
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Adicionar concorrentes */}
        <form action={addCompetitors} className="mt-4 space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
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
            <span className="ml-3 text-sm text-gray-500">
              Limite do plano atingido —{" "}
              <a href="/planos" className="text-pink-700 hover:underline">
                fazer upgrade
              </a>
            </span>
          )}
        </form>
      </div>

      {/* Resultados da análise (inline — o conteúdo unificado da empresa) */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Inteligência gerada</h2>
        <AnalysisResults
          ideas={ideas}
          scripts={scripts}
          gaps={gaps}
          trends={trends}
          insights={insights}
          report={report}
          alerts={alerts}
          lastRun={lastRun}
        />
      </div>
    </div>
  );
}
