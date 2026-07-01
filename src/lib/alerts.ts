// Sistema de Alertas (Fase 3). Após a análise, compara os dados coletados e
// gera alertas estratégicos. Hoje detecta:
//  - NOVO_VIRAL: post muito acima da média do concorrente.
//  - TENDENCIA: temas/formatos crescentes (vindos do Trend Hunter, Fase 2).
// (NOVA_OFERTA / MUDANCA_BIO / NOVO_FORMATO precisam de histórico/snapshots —
//  ficam para uma evolução futura da coleta.)

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const VIRAL_MULTIPLIER = 2; // 2x a média do concorrente
const VIRAL_FLOOR = 50; // ignora médias muito baixas (ruído)

export async function detectAlerts(projectId: string): Promise<number> {
  // Análise sempre "fresca": limpa alertas anteriores deste projeto.
  await db.alert.deleteMany({ where: { projectId } });

  const created: Prisma.AlertCreateManyInput[] = [];

  // --- NOVO_VIRAL: por concorrente, posts bem acima da média ---------------
  const competitors = await db.competitor.findMany({
    where: { projectId },
    include: { contents: true },
  });
  for (const c of competitors) {
    const likesArr = c.contents.map((ct) => ct.likes ?? 0).filter((n) => n > 0);
    if (likesArr.length < 3) continue;
    const avg = likesArr.reduce((a, b) => a + b, 0) / likesArr.length;
    if (avg < VIRAL_FLOOR) continue;
    for (const ct of c.contents) {
      const likes = ct.likes ?? 0;
      if (likes >= avg * VIRAL_MULTIPLIER) {
        created.push({
          projectId,
          type: "NOVO_VIRAL",
          competitor: c.handle,
          description: `Post de @${c.handle} com ${likes.toLocaleString("pt-BR")} curtidas — ${(likes / avg).toFixed(1)}x a média do perfil.`,
          impact:
            "Conteúdo com desempenho muito acima do normal: sinaliza um formato/gancho quente no nicho.",
          action:
            "Faça engenharia reversa desse post e produza uma versão original e diferenciada.",
        });
      }
    }
  }

  // --- TENDENCIA: a partir das tendências detectadas na última análise ------
  const trends = await db.trend.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  for (const t of trends) {
    created.push({
      projectId,
      type: "TENDENCIA",
      competitor: null,
      description: `Tendência emergente (${t.kind}): ${t.title} — ${t.description}`,
      impact: "Tema/formato crescendo; entrar cedo aumenta alcance.",
      action: "Priorize conteúdos sobre este tema nos próximos dias.",
    });
  }

  if (created.length > 0) {
    await db.alert.createMany({ data: created });
  }
  return created.length;
}
