// Peças de UI reutilizáveis do produto (tema escuro).
import Link from "next/link";

export function Section({
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

export function PotentialBadge({ potential }: { potential: string }) {
  const color =
    potential === "ALTO"
      ? "bg-brand-500/15 text-brand-300"
      : potential === "BAIXO"
        ? "bg-neutral-800 text-neutral-400"
        : "bg-amber-500/15 text-amber-300";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {potential}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "amber";
}) {
  const cls =
    tone === "brand"
      ? "bg-brand-500/15 text-brand-300"
      : tone === "amber"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-neutral-800 text-neutral-300";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-neutral-400">
      {children}
    </p>
  );
}

// Cartão de métrica com link para o dashboard correspondente.
export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link href={href} className="card card-hover block p-4">
      <p className="text-2xl font-bold text-brand-400">{value}</p>
      <p className="mt-1 text-sm text-neutral-400">{label} →</p>
    </Link>
  );
}
