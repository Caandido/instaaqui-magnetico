import { redirect } from "next/navigation";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";
import { db } from "@/lib/db";
import { createProject } from "@/app/actions/projects";
import { CollectButton } from "@/components/collect-button";

export default async function ProjetosPage() {
  const data = await getCurrentUserWithOrgs();
  if (!data) redirect("/login");
  const activeOrg = await getActiveOrg(data.orgs);
  if (!activeOrg) return null;

  const projects = await db.project.findMany({
    where: { organizationId: activeOrg.id },
    orderBy: { createdAt: "desc" },
    include: {
      competitors: {
        orderBy: { handle: "asc" },
        include: { _count: { select: { contents: true } } },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Projetos</h1>
        <p className="text-gray-600">
          Crie um projeto de análise e adicione os concorrentes a monitorar.
        </p>
      </div>

      {/* Formulário de criação */}
      <form
        action={createProject}
        className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Nome do projeto *
          </span>
          <input name="name" required className="input" placeholder="Ex.: Análise nicho fitness" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Nicho</span>
          <input name="niche" className="input" placeholder="Ex.: Marketing Digital" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Seu perfil (@)
          </span>
          <input name="handle" className="input" placeholder="@suaempresa" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Objetivo</span>
          <input name="objective" className="input" placeholder="Ex.: gerar mais leads" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Concorrentes (um por linha ou separados por vírgula)
          </span>
          <textarea
            name="competitors"
            rows={3}
            className="input"
            placeholder="@concorrente1&#10;@concorrente2&#10;@concorrente3"
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">
            Criar projeto
          </button>
        </div>
      </form>

      {/* Lista de projetos */}
      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
          Nenhum projeto ainda. Crie o primeiro acima.
        </p>
      ) : (
        <div className="space-y-5">
          {projects.map((p) => {
            const totalContents = p.competitors.reduce(
              (acc, c) => acc + c._count.contents,
              0
            );
            return (
              <div
                key={p.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{p.name}</h2>
                    <p className="text-sm text-gray-500">
                      {p.niche ? `${p.niche} · ` : ""}
                      {p.competitors.length} concorrente(s) · {totalContents} conteúdo(s)
                      coletado(s)
                    </p>
                  </div>
                  <CollectButton projectId={p.id} />
                </div>

                {p.competitors.length > 0 && (
                  <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
                    {p.competitors.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                      >
                        <span className="font-medium">@{c.handle}</span>
                        <span className="text-gray-500">
                          {c.followers != null
                            ? `${c.followers.toLocaleString("pt-BR")} seguidores · `
                            : ""}
                          {c._count.contents} post(s)
                          {c.lastCollectedAt ? " · coletado ✓" : " · ainda não coletado"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
