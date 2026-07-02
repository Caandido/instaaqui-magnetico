"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Job = {
  status: string;
  itemsCollected?: number | null;
  error?: string | null;
};

export function CollectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function summarize(jobs: Job[]): { msg: string; detail: string | null } {
    const completed = jobs.filter((j) => j.status === "COMPLETED");
    const failed = jobs.filter((j) => j.status === "FAILED");
    const items = completed.reduce((a, j) => a + (j.itemsCollected ?? 0), 0);

    // Erro mais informativo dentre os que falharam.
    const firstError = failed.find((j) => j.error)?.error ?? null;

    if (items > 0) {
      const extra = failed.length
        ? ` · ${failed.length} concorrente(s) falharam`
        : "";
      return { msg: `✅ ${items} post(s) coletados${extra}.`, detail: firstError };
    }
    if (failed.length > 0) {
      return {
        msg: `❌ Coleta falhou em ${failed.length} concorrente(s).`,
        detail: firstError,
      };
    }
    // Terminou sem falhas mas 0 posts: perfil privado/sem posts ou Instagram bloqueou.
    return {
      msg: "⚠️ Concluído, mas 0 posts. Perfis podem estar privados ou o Instagram bloqueou a coleta. Tente de novo em alguns minutos.",
      detail: null,
    };
  }

  async function poll(attempt = 0): Promise<void> {
    if (attempt > 36) {
      setStatus(
        "⏳ A coleta ainda está rodando na Apify. Atualize a página em ~1 min para ver os resultados."
      );
      setBusy(false);
      return;
    }
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`/api/coleta?projectId=${projectId}`);
    const data = await res.json();
    const jobs: Job[] = data.jobs ?? [];
    const running = jobs.filter((j) => j.status === "RUNNING").length;
    if (running === 0) {
      const { msg, detail } = summarize(jobs);
      setStatus(msg);
      setDetail(detail);
      setBusy(false);
      router.refresh();
      return;
    }
    setStatus(`Coletando… (${running} em andamento)`);
    return poll(attempt + 1);
  }

  async function start() {
    setBusy(true);
    setDetail(null);
    setStatus("Iniciando coleta…");
    const res = await fetch("/api/coleta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus(`❌ ${d.error ?? "Falha ao iniciar a coleta."}`);
      setBusy(false);
      return;
    }
    setStatus("Coletando… (pode levar cerca de 1 minuto)");
    poll();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={start} disabled={busy} className="btn-primary">
          {busy ? "Coletando…" : "Coletar agora"}
        </button>
        {status && <span className="text-sm text-neutral-400">{status}</span>}
      </div>
      {detail && (
        <span className="max-w-md text-right text-xs text-red-400/80 break-words">
          {detail}
        </span>
      )}
    </div>
  );
}
