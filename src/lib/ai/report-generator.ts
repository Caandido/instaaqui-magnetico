// Agente 7 — Report Generator: consolida tudo no relatório (resumo executivo,
// top conteúdos, ganchos vencedores, alertas e plano de 7 dias).
import { generateStructured } from "./llm";
import {
  ReportResult,
  type GapResult,
  type InsightResult,
  type TrendResult,
  type CopyResult,
} from "./schemas";
import { BASE_IDENTITY, projectContext } from "./prompts";

const SYSTEM = `${BASE_IDENTITY}

Papel: REPORT GENERATOR. Consolide as análises em um relatório executivo com:
- summary: resumo dos principais movimentos e oportunidades.
- topContents: conteúdos de destaque (externalId + por que se destacou).
- winningHooks: ganchos vencedores.
- strategicAlerts: alertas (type, description, impact, action).
- sevenDayPlan: plano de conteúdo para os próximos 7 dias (day 1..7, theme, format, hook).
Seja objetivo e acionável.`;

export async function generateReport(
  project: Parameters<typeof projectContext>[0],
  data: {
    insights: InsightResult;
    gaps: GapResult;
    trends: TrendResult;
    copy: CopyResult;
  }
): Promise<ReportResult> {
  const user = `${projectContext(project)}

INSIGHTS:
${data.insights.insights.map((i) => `- ${i.hook} → ${i.reason}`).join("\n") || "(nenhum)"}

GAPS:
${data.gaps.gaps.map((g) => `- ${g.theme} (${g.potential}): ${g.recommendation}`).join("\n") || "(nenhum)"}

TENDÊNCIAS:
${data.trends.trends.map((t) => `- [${t.kind}] ${t.title}: ${t.description}`).join("\n") || "(nenhuma)"}

IDEIAS (amostra):
${data.copy.ideas.slice(0, 10).map((i) => `- ${i.title} (${i.potential})`).join("\n") || "(nenhuma)"}

Gere o relatório consolidado com plano de 7 dias.`;
  return generateStructured({
    system: SYSTEM,
    user,
    schema: ReportResult,
    maxTokens: 12000,
  });
}
