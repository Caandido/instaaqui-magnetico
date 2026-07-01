"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Job = { status: string };

export function CollectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function poll(attempt = 0): Promise<void> {
    if (attempt > 36) {
      setStatus("A coleta está demorando. Atualize a página em instantes.");
      setBusy(false);
      return;
    }
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`/api/coleta?projectId=${projectId}`);
    const data = await res.json();
    const jobs: Job[] = data.jobs ?? [];
    const running = jobs.filter((j) => j.status === "RUNNING").length;
    if (running === 0) {
      setStatus("Coleta concluída! Atualizando…");
      setBusy(false);
      router.refresh();
      return;
    }
    setStatus(`Coletando… (${running} em andamento)`);
    return poll(attempt + 1);
  }

  async function start() {
    setBusy(true);
    setStatus("Iniciando coleta…");
    const res = await fetch("/api/coleta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus(d.error ?? "Falha ao iniciar a coleta.");
      setBusy(false);
      return;
    }
    setStatus("Coletando… (pode levar cerca de 1 minuto)");
    poll();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={start} disabled={busy} className="btn-primary">
        {busy ? "Coletando…" : "Coletar agora"}
      </button>
      {status && <span className="text-sm text-neutral-400">{status}</span>}
    </div>
  );
}
