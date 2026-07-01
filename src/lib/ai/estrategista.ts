// Agente 4 — Estrategista: encontra GAPS (temas pouco explorados, alta demanda
// e baixa concorrência) a partir dos insights e do conteúdo dos concorrentes.
import { generateStructured } from "./anthropic";
import { GapResult, type InsightResult } from "./schemas";
import { BASE_IDENTITY, projectContext } from "./prompts";
import { serializePosts, type PostLite } from "./context";

const SYSTEM = `${BASE_IDENTITY}

Papel: ESTRATEGISTA. Encontre GAPS de conteúdo: temas que os concorrentes quase
não abordam, ou onde há alta demanda e baixa concorrência. Para cada gap:
- theme, reason (por que é uma oportunidade), potential (ALTO/MEDIO/BAIXO) e
  recommendation (o que produzir para explorá-lo).
Gere de 5 a 8 gaps priorizando os de maior potencial.`;

export async function findGaps(
  project: Parameters<typeof projectContext>[0],
  posts: PostLite[],
  insights: InsightResult
): Promise<GapResult> {
  const insightsText =
    insights.insights
      .map((i) => `- ${i.hook} (${i.narrative ?? "narrativa n/d"}) → ${i.reason}`)
      .join("\n") || "(sem insights)";
  const user = `${projectContext(project)}

Padrões/insights já detectados:
${insightsText}

Panorama do conteúdo dos concorrentes:
${serializePosts(posts.slice(0, 30))}`;
  return generateStructured({
    system: SYSTEM,
    user,
    schema: GapResult,
    maxTokens: 8000,
  });
}
