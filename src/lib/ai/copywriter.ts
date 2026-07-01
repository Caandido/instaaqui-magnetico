// Agente 5 — Copywriter: gera NO MÍNIMO 20 ideias + roteiros a partir dos
// insights e gaps. Formatos seguem o CLAUDE.md. Nunca copia; sempre diferencia.
import { generateStructured } from "./anthropic";
import { CopyResult, type GapResult, type InsightResult } from "./schemas";
import { BASE_IDENTITY, projectContext } from "./prompts";

const SYSTEM = `${BASE_IDENTITY}

Papel: COPYWRITER. Com base nos insights e gaps, gere conteúdo ORIGINAL:
- ideas: NO MÍNIMO 20 ideias, cada uma com title, hook, structure, cta e potential (ALTO/MEDIO/BAIXO).
- scripts: 3 a 5 roteiros, cada um com objective, hook, scenes (cenas, uma por linha), cta e caption (legenda sugerida).
Diferencie-se dos concorrentes — não replique ganchos, crie novos.`;

export async function generateCopy(
  project: Parameters<typeof projectContext>[0],
  insights: InsightResult,
  gaps: GapResult
): Promise<CopyResult> {
  const insightsText =
    insights.insights
      .map((i) => `- Gancho: ${i.hook} | Motivo: ${i.reason}`)
      .join("\n") || "(sem insights)";
  const gapsText =
    gaps.gaps.map((g) => `- ${g.theme}: ${g.recommendation}`).join("\n") ||
    "(sem gaps)";
  const user = `${projectContext(project)}

Insights de viralização:
${insightsText}

Gaps/oportunidades:
${gapsText}

Gere pelo menos 20 ideias e 3–5 roteiros, originais e diferenciados.`;
  return generateStructured({
    system: SYSTEM,
    user,
    schema: CopyResult,
    maxTokens: 16000,
  });
}
