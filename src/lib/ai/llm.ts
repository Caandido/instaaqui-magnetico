// Cliente de IA (LLM) + utilitário para "pedir JSON validado".
// Backend atual: GitHub Models (grátis com uma conta GitHub, sem cartão e sem
// bloqueio de região). Modelo: gpt-4o-mini (ótimo seguindo JSON). O limite é
// por requisição/minuto (não por tokens/min minúsculo), então o pipeline de 6
// agentes cabe. A resposta é sempre validada por um schema Zod: pedimos JSON
// (response_format), validamos e, se fugir do formato, tentamos de novo.

import { z } from "zod";

// Modelo padrão no GitHub Models (grátis). gpt-4o-mini segue bem o formato JSON.
export const AI_MODEL = "gpt-4o-mini";

const ENDPOINT = "https://models.inference.ai.azure.com/chat/completions";

// gpt-4o-mini no tier gratuito aceita ~4000 tokens de saída por requisição.
const MAX_OUTPUT_CAP = 4000;

export function hasAIKey(): boolean {
  return Boolean(process.env.GITHUB_MODELS_TOKEN);
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Extrai o objeto JSON caso venha cercado por ```json ... ``` ou com texto ao redor.
function extractJson(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) return s.slice(first, last + 1);
  return s;
}

async function callModel(
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.GITHUB_MODELS_TOKEN;
  if (!apiKey) {
    throw new Error("GITHUB_MODELS_TOKEN não configurado no servidor.");
  }

  // Até 3 tentativas em caso de rate limit (429).
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: Math.min(maxTokens, MAX_OUTPUT_CAP),
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429 && attempt < 2) {
      const retryAfter = Number(res.headers.get("retry-after")) || (attempt + 1) * 5;
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 12) * 1000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GitHub Models respondeu ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (data.error?.message) throw new Error(`GitHub Models: ${data.error.message}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("GitHub Models não retornou conteúdo.");
    return content;
  }
  throw new Error("GitHub Models: limite de requisições excedido (429) após retentativas.");
}

// Pede à IA um resultado no formato do schema. Lança se a IA fugir do formato.
export async function generateStructured<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const maxTokens = opts.maxTokens ?? MAX_OUTPUT_CAP;
  const jsonSchema = z.toJSONSchema(opts.schema);

  const system =
    `${opts.system}\n\n` +
    "IMPORTANTE: responda em português e SOMENTE com um único objeto JSON " +
    "válido, sem nenhum texto antes ou depois, seguindo exatamente este JSON Schema:\n" +
    JSON.stringify(jsonSchema);

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: opts.user },
  ];

  // Duas tentativas: se o JSON não bater com o schema, reenviamos com o erro.
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callModel(messages, maxTokens);
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
