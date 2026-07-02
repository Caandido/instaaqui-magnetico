// Cliente de IA (LLM) + utilitário para "pedir JSON validado".
// Backend atual: Google Gemini (AI Studio, plano gratuito sem cartão e com
// limite de tokens/minuto muito alto — adequado ao pipeline de 6 agentes).
// A resposta é sempre validada por um schema Zod: pedimos JSON, validamos e,
// se fugir do formato, tentamos de novo com a mensagem de erro como dica.

import { z } from "zod";

// Modelo padrão no Gemini (grátis, rápido, 1M tokens/min no free tier).
export const AI_MODEL = "gemini-2.0-flash";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Gemini 2.0 Flash aceita até 8192 tokens de saída.
const MAX_OUTPUT_CAP = 8192;

export function hasAIKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

type Turn = { role: "user" | "model"; text: string };

async function callGemini(
  system: string,
  turns: Turn[],
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurado no servidor.");
  }

  const url = `${API_BASE}/${AI_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: Math.min(maxTokens, MAX_OUTPUT_CAP),
      responseMimeType: "application/json",
    },
  };

  // Até 3 tentativas em caso de rate limit (429).
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429 && attempt < 2) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 4000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini respondeu ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        finishReason?: string;
      }[];
      promptFeedback?: { blockReason?: string };
    };

    if (data.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini bloqueou o conteúdo: ${data.promptFeedback.blockReason}`
      );
    }

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const content = parts.map((p) => p.text ?? "").join("");
    if (!content) throw new Error("Gemini não retornou conteúdo.");
    return content;
  }
  throw new Error("Gemini: limite de requisições excedido (429) após retentativas.");
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

  const turns: Turn[] = [{ role: "user", text: opts.user }];

  // Duas tentativas: se o JSON não bater com o schema, reenviamos com o erro.
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGemini(system, turns, maxTokens);
    try {
      const parsed = JSON.parse(raw);
      return opts.schema.parse(parsed) as T;
    } catch (e) {
      lastError = String(e);
      turns.push({ role: "model", text: raw });
      turns.push({
        role: "user",
        text:
          "O JSON acima está inválido ou não segue o schema. Corrija e " +
          `responda de novo APENAS com o JSON válido. Erro: ${lastError.slice(0, 400)}`,
      });
    }
  }
  throw new Error(
    `A IA não retornou um JSON válido no formato esperado. ${lastError.slice(0, 200)}`
  );
}
