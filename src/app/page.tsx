import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          InstaAqui <span className="text-pink-600">Magnético</span>
        </h1>
        <p className="text-lg text-gray-600">
          Inteligência competitiva para Instagram: monitore concorrentes e
          transforme dados em ideias, roteiros e oportunidades.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup" className="btn-primary">
          Começar agora
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
