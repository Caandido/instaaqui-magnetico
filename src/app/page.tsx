import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="animate-fade-up flex min-h-screen flex-col items-center justify-center gap-8 bg-transparent px-4 text-center">
      <div className="max-w-xl space-y-4">
        <BrandLogo size="lg" className="justify-center text-3xl" />
        <p className="text-lg text-neutral-300">
          Inteligência competitiva para Instagram: monitore concorrentes e
          transforme dados em <span className="text-shimmer font-semibold">ideias,
          roteiros e oportunidades</span>.
        </p>
        <div className="mx-auto h-1 w-16 rounded-full bg-brand-500 brand-glow" />
      </div>
      <div className="flex gap-3">
        <Link href="/signup" className="btn-primary">
          Começar agora
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-neutral-800"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
