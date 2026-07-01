"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/empresa", label: "Visão geral" },
  { href: "/empresa/conteudos", label: "Conteúdos" },
  { href: "/empresa/tendencias", label: "Tendências" },
  { href: "/empresa/ganchos", label: "Ganchos" },
  { href: "/empresa/ideias", label: "Ideias" },
  { href: "/empresa/roteiros", label: "Roteiros" },
  { href: "/empresa/gaps", label: "Gaps" },
  { href: "/empresa/alertas", label: "Alertas" },
  { href: "/empresa/relatorios", label: "Relatório" },
];

export function EmpresaTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-white/10 pb-2">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition ${
              active
                ? "bg-brand-500/15 font-medium text-brand-300"
                : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
