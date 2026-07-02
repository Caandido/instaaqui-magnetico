// Cliente de IA (LLM) + utilitário para "pedir JSON validado".
// Backend atual: GitHub Models (grátis com uma conta GitHub, sem cartão e sem
// bloqueio de região). Modelo: gpt-4o-mini.
// Usa Structured Outputs (response_format json_schema strict): a API OBRIGA a
// resposta a bater exatamente com o schema (chaves, tipos e objetos aninhados).
// Como rede de segurança, ainda validamos com Zod e, se o endpoint recusar o
// schema strict, caímos para o modo json_object com reparo + retentativa.

import { z } from "zod";

// Modelo padrão no GitHub Models (grátis). gpt-4o-mini suporta structured outputs.
export const AI_MODEL = "gpt-4o-mini";

const ENDPOINT = "https://models.inference.ai.azure.com/chat/completions";

// gpt-4o-mini no tier gratuito aceita ~4000 tokens de saída por requisição.
const MAX_OUTPUT_CAP = 4000;

export function hasAIKey(): boolean {
  return Boolean(process.env.GITHUB_MODELS_TOKEN);
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Converte um JSON Schema (gerado pelo Zod) para o formato strict da OpenAI:
// todo objeto ganha additionalProperties:false e required com TODAS as chaves.
function makeStrict(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(makeStrict);
  if (node && typeof node === "object") {
    const src = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
      if (k === "$schema") continue;
      out[k] = makeStrict(v);
    }
    if (out.type === "object" && out.properties && typeof out.properties === "object") {
      out.additionalProperties = false;
      out.required = Object.keys(out.properties as Record<string, unknown>);
    }
    return out;
  }
  return node;
}

// Extrai o objeto/array JSON caso venha cercado por ```json ... ``` ou com texto.
function extractJson(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const objFirst = s.indexOf("{");
  const arrFirst = s.indexOf("[");
  const useArray = arrFirst !== -1 && (objFirst === -1 || arrFirst < objFirst);
  const open = useArray ? "[" : "{";
  const close = useArray ? "]" : "}";
  const first = s.indexOf(open);
  const last = s.lastIndexOf(close);
  if (first !== -1 && last !== -1 && last > first) return s.slice(first, last + 1);
  return s;
}

// Reencaixa a resposta quando o schema tem UMA chave-raiz de lista e o modelo
// devolveu o array solto ou com outro nome. Ex.: [...] → { "trends": [...] }.
function coerceShape(parsed: unknown, topKeys: string[]): unknown {
  if (topKeys.length !== 1) return parsed;
  const key = topKeys[0];
  if (Array.isArray(parsed)) return { [key]: parsed };
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (obj[key] === undefined) {
      const arrKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
      if (arrKey) return { [key]: obj[arrKey] };
    }
  }
  return parsed;
}

async function callModel(
  messages: ChatMessage[],
  maxTokens: number,
  responseFormat: unknown
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
        temperature: 0.4,
        max_tokens: Math.min(maxTokens, MAX_OUTPUT_CAP),
        response_format: responseFormat,
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
  const jsonSchema = z.toJSONSchema(opts.schema) as {
    properties?: Record<string, unknown>;
  };
  const topKeys = Object.keys(jsonSchema.properties ?? {});

  // Formato strict (garante a estrutura) e o fallback simples (json_object).
  const strictFormat = {
    type: "json_schema",
    json_schema: {
      name: "resultado",
      strict: true,
      schema: makeStrict(jsonSchema),
    },
  };
  const jsonObjectFormat = { type: "json_object" };

  const system =
    `${opts.system}\n\n` +
    "IMPORTANTE: responda em português e SOMENTE com um único objeto JSON " +
    "válido, sem nenhum texto antes ou depois. O objeto de NÍVEL RAIZ deve " +
    `conter exatamente esta(s) chave(s): ${topKeys.join(", ")}. ` +
    "Siga exatamente este JSON Schema:\n" +
    JSON.stringify(jsonSchema);

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: opts.user },
  ];

  let useStrict = true;
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    let raw: string;
    try {
      raw = await callModel(
        messages,
        maxTokens,
        useStrict ? strictFormat : jsonObjectFormat
      );
    } catch (e) {
      // Se o endpoint recusar o schema strict (400), cai pro json_object.
      if (useStrict && String(e).includes("respondeu 400")) {
        useStrict = false;
        continue;
      }
      throw e;
    }

    try {
      const parsed = coerceShape(JSON.parse(extractJson(raw)), topKeys);
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
