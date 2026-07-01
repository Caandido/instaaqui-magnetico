// Agente 2 — Classificador: categoria/formato/objetivo de cada conteúdo.
import { generateStructured } from "./anthropic";
import { ClassificationResult } from "./schemas";
import { BASE_IDENTITY } from "./prompts";
import { serializePosts, type PostLite } from "./context";

const SYSTEM = `${BASE_IDENTITY}

Papel: CLASSIFICADOR. Para cada post recebido, atribua:
- category: Educacional, Autoridade, Bastidores, Prova Social, Oferta, Tendência, Polêmico ou Entretenimento.
- format: Reels, Carrossel, Story, Meme, Corte ou UGC.
- objective: Alcance, Engajamento, Conversão ou Branding.
Classifique TODOS os posts. Devolva o mesmo externalId de cada um.`;

export async function classifyPosts(
  posts: PostLite[]
): Promise<ClassificationResult> {
  if (posts.length === 0) return { items: [] };
  const user = `Classifique estes posts:\n\n${serializePosts(posts)}`;
  return generateStructured({
    system: SYSTEM,
    user,
    schema: ClassificationResult,
    maxTokens: 8000,
  });
}
