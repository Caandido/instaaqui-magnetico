import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getCurrentUserWithOrgs, getActiveOrg } from "@/lib/org";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getCurrentUserWithOrgs();
  if (!data) redirect("/login");

  const activeOrg = await getActiveOrg(data.orgs);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            InstaAqui <span className="text-pink-600">Magnético</span>
          </Link>

          <div className="flex items-center gap-4">
            {activeOrg && (
              <WorkspaceSwitcher orgs={data.orgs} activeId={activeOrg.id} />
            )}
            <span className="hidden text-sm text-gray-500 sm:inline">
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
                className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
