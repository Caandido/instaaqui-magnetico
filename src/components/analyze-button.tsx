"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Dispara o pipeline de IA (Fase 2). A chamada é síncrona e pode levar até ~1min.
export function AnalyzeButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function analyze() {
    setBusy(true);
    setStatus("Analisando com IA… (pode levar até ~1 minuto)");
    try {
      const res = await fetch("/api/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.error ?? "Falha ao analisar.");
        setBusy(false);
        return;
      }
      setStatus("Análise concluída! Atualizando…");
      setBusy(false);
      router.refresh();
    } catch (e) {
      setStatus(String(e));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={analyze} disabled={busy} className="btn-secondary">
        {busy ? "Analisando…" : "Analisar com IA"}
      </button>
      {status && <span className="text-sm text-gray-500">{status}</span>}
    </div>
  );
}
