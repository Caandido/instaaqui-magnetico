// Agente 3 — Analista de Viralização: engenharia reversa dos posts de maior
// desempenho (Gancho → Desenvolvimento → CTA → Motivo) + padrões gerais.
import { generateStructured } from "./anthropic";
import { InsightResult } from "./schemas";
import { BASE_IDENTITY, projectContext } from "./prompts";
import { serializePosts, topPosts, type PostLite } from "./context";

const SYSTEM = `${BASE_IDENTITY}

Papel: ANALISTA DE VIRALIZAÇÃO. Faça engenharia reversa dos conteúdos que mais
performaram e extraia padrões de sucesso. Para cada insight, identifique:
- hook (gancho), development (desenvolvimento), cta, narrative (narrativa) e reason (motivo do sucesso).
Gere um insight por post relevante (com externalId) e também 2–3 insights de
PADRÃO GERAL (externalId = null) que resumam o que faz o conteúdo do nicho performar.`;

export async function analyzeVirality(
  project: Parameters<typeof projectContext>[0],
  posts: PostLite[]
): Promise<InsightResult> {
  if (posts.length === 0) return { insights: [] };
  const top = topPosts(posts, 10);
  const user = `${projectContext(project)}

Posts de maior desempenho para analisar:
${serializePosts(top)}`;
  return generateStructured({
    system: SYSTEM,
    user,
    schema: InsightResult,
    maxTokens: 12000,
  });
}
