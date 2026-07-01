// Cliente Claude (Anthropic) + utilitário para "pedir JSON validado".
// A resposta é sempre validada por um schema Zod (structured outputs), então a
// IA nunca devolve algo "torto". As instruções fixas de cada agente entram no
// system prompt com prompt caching (cache_control) para reduzir custo.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

// Modelo padrão (o mais capaz). Só troque se houver motivo explícito.
export const AI_MODEL = "claude-opus-4-8";

let _client: Anthropic | null = null;

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurado no servidor.");
  }
  _client ??= new Anthropic({ apiKey });
  return _client;
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Pede à IA um resultado no formato do schema. Lança se a IA fugir do formato.
export async function generateStructured<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const response = await client().messages.parse({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    // Instruções fixas do agente → cacheadas (prefixo estável).
    system: [
      {
        type: "text",
        text: opts.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    // Dados voláteis (variam a cada chamada) → depois do prefixo cacheado.
    messages: [{ role: "user", content: opts.user }],
    output_config: { format: zodOutputFormat(opts.schema) },
  });

  const parsed = response.parsed_output as T | null;
  if (!parsed) {
    throw new Error("A IA não retornou um resultado no formato esperado.");
  }
  return parsed;
}
