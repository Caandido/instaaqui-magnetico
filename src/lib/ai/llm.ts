// Cliente de IA (LLM) + utilitário para "pedir JSON validado".
// Backend atual: OpenRouter (API compatível com OpenAI, plano gratuito sem
// cartão e sem bloqueio de região). Modelo grátis: Llama 3.3 70B.
// O limite do free tier é por nº de requisições (não por tokens/min), então o
// pipeline de 6 agentes cabe. A resposta é sempre validada por um schema Zod:
// pedimos JSON, validamos e, se fugir do formato, tentamos de novo.

import { z } from "zod";

// Modelo padrão no OpenRouter (grátis). Troque aqui se quiser outro modelo
// gratuito (ex.: "google/gemini-2.0-flash-exp:free").
export const AI_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function hasAIKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Extrai o objeto JSON de uma resposta que pode vir cercada por ```json ... ```
// ou com texto ao redor (modelos grátis nem sempre respeitam "só JSON").
function extractJson(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return s.slice(first, last + 1);
  }
  return s;
}

async function callOpenRouter(
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurado no servidor.");
  }

  // Até 3 tentativas em caso de rate limit (429).
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://instaaqui-magnetico.vercel.app",
        "X-Title": "InstaAqui Magnetico",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: maxTokens,
      }),
    });

    if (res.status === 429 && attempt < 2) {
      const retryAfter = Number(res.headers.get("retry-after")) || (attempt + 1) * 4;
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 10) * 1000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter respondeu ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (data.error?.message) throw new Error(`OpenRouter: ${data.error.message}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter não retornou conteúdo.");
    return content;
  }
  throw new Error("OpenRouter: limite de requisições excedido (429) após retentativas.");
}

// Pede à IA um resultado no formato do schema. Lança se a IA fugir do formato.
export async function generateStructured<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const maxTokens = opts.maxTokens ?? 8000;
  const jsonSchema = z.toJSONSchema(opts.schema);

  const system =
    `${opts.system}\n\n` +
    "IMPORTANTE: responda em português e SOMENTE com um único objeto JSON " +
    "válido, sem nenhum texto, comentário ou cerca de código antes ou depois, " +
    "seguindo exatamente este JSON Schema:\n" +
    JSON.stringify(jsonSchema);

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: opts.user },
  ];

  // Duas tentativas: se o JSON não bater com o schema, reenviamos com o erro.
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callOpenRouter(messages, maxTokens);
    try {
      const parsed = JSON.parse(extractJson(raw));
      return opts.schema.parse(parsed) as T;
    } catch (e) {
      lastError = String(e);
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content:
          "O JSON acima está inválido ou não segue o schema. Corrija e " +
          `responda de novo APENAS com o JSON válido. Erro: ${lastError.slice(0, 400)}`,
      });
    }
  }
  throw new Error(
    `A IA não retornou um JSON válido no formato esperado. ${lastError.slice(0, 200)}`
  );
}
