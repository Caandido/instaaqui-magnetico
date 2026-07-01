import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { BrandLogo } from "@/components/brand-logo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getCurrentUserWithOrgs();
  if (!data) redirect("/login");

  const activeOrg = await getActiveOrg(data.orgs);

  return (
    <div className="min-h-screen bg-transparent text-neutral-100">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <BrandLogo />
            </Link>
            <nav className="flex items-center gap-4 text-sm text-neutral-300">
              <Link href="/dashboard" className="hover:text-neutral-100">
                Dashboard
              </Link>
              <Link href="/empresa" className="hover:text-neutral-100">
                Empresa
              </Link>
              <Link href="/planos" className="hover:text-neutral-100">
                Planos
              </Link>
              <Link href="/configuracoes" className="hover:text-neutral-100">
                Configurações
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {activeOrg && (
              <WorkspaceSwitcher orgs={data.orgs} activeId={activeOrg.id} />
            )}
            <span className="hidden text-sm text-neutral-400 sm:inline">
              {data.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-white/15 px-3 py-1 text-sm hover:bg-neutral-800"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="animate-fade-up mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
