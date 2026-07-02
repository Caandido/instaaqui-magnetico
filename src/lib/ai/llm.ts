// Cliente de IA (LLM) + utilitário para "pedir JSON validado".
// Backend atual: Groq (API compatível com OpenAI, plano gratuito sem cartão).
// Modelo: Llama 3.3 70B. A resposta é sempre validada por um schema Zod, então
// a IA nunca devolve algo "torto": pedimos JSON, validamos e, se fugir do
// formato, tentamos de novo com a mensagem de erro como dica.

import { z } from "zod";

// Modelo padrão no Groq. Troque aqui se quiser outro (ex.: "llama-3.1-8b-instant"
// para respostas mais rápidas e limites de uso maiores).
export const AI_MODEL = "llama-3.3-70b-versatile";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function hasAIKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

async function callGroq(
  messages: GroqMessage[],
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY não configurado no servidor.");
  }

  // Até 3 tentativas em caso de rate limit (429) do plano gratuito.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429 && attempt < 2) {
      const retryAfter = Number(res.headers.get("retry-after")) || 3;
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 8) * 1000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Groq respondeu ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq não retornou conteúdo.");
    return content;
  }
  throw new Error("Groq: limite de requisições excedido (429) após retentativas.");
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
    "válido, sem nenhum texto antes ou depois, seguindo exatamente este JSON Schema:\n" +
    JSON.stringify(jsonSchema);

  const messages: GroqMessage[] = [
    { role: "system", content: system },
    { role: "user", content: opts.user },
  ];

  // Duas tentativas: se o JSON não bater com o schema, reenviamos com o erro.
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGroq(messages, maxTokens);
    try {
      const parsed = JSON.parse(raw);
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
  throw new Error(`A IA não retornou um JSON válido no formato esperado. ${lastError.slice(0, 200)}`);
}
