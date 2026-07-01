"use client";

import { useState } from "react";

// Botão que copia um texto para a área de transferência.
export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <button
      onClick={copy}
      className="rounded-md border border-white/15 px-2 py-1 text-xs text-neutral-300 transition hover:border-brand-400 hover:text-brand-300"
    >
      {copied ? "Copiado ✓" : label}
    </button>
  );
}
