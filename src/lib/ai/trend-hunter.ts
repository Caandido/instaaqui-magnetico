// Agente 6 — Trend Hunter: detecta tendências emergentes (assuntos, formatos,
// ganchos e narrativas que começaram a crescer) comparando o conteúdo recente.
import { generateStructured } from "./anthropic";
import { TrendResult } from "./schemas";
import { BASE_IDENTITY, projectContext } from "./prompts";
import { serializePosts, type PostLite } from "./context";

const SYSTEM = `${BASE_IDENTITY}

Papel: TREND HUNTER. Detecte TENDÊNCIAS EMERGENTES — temas, formatos, ganchos ou
narrativas que aparecem com frequência crescente ou que começaram a surgir.
Para cada tendência: kind (assunto | formato | gancho | narrativa), title e description.
Foque no que está COMEÇANDO a crescer, não no que já está saturado. Gere 4 a 8 tendências.`;

export async function huntTrends(
  project: Parameters<typeof projectContext>[0],
  posts: PostLite[]
): Promise<TrendResult> {
  if (posts.length === 0) return { trends: [] };
  const user = `${projectContext(project)}

Conteúdo recente dos concorrentes (ordenado por coleta):
${serializePosts(posts.slice(0, 40))}`;
  return generateStructured({
    system: SYSTEM,
    user,
    schema: TrendResult,
    maxTokens: 8000,
  });
}
