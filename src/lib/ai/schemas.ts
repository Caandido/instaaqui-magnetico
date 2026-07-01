// Formatos de saída (Zod) de cada agente de IA — seguem o CLAUDE.md.
// Structured outputs não suportam min/max/minItems; as quantidades mínimas
// (ex.: "≥20 ideias") são pedidas no prompt, não no schema.

import { z } from "zod";

export const PotentialEnum = z.enum(["ALTO", "MEDIO", "BAIXO"]);

// --- Agente 2 — Classificador ---------------------------------------------
export const CategoryEnum = z.enum([
  "Educacional",
  "Autoridade",
  "Bastidores",
  "Prova Social",
  "Oferta",
  "Tendência",
  "Polêmico",
  "Entretenimento",
]);
export const FormatEnum = z.enum([
  "Reels",
  "Carrossel",
  "Story",
  "Meme",
  "Corte",
  "UGC",
]);
export const ObjectiveEnum = z.enum([
  "Alcance",
  "Engajamento",
  "Conversão",
  "Branding",
]);

export const ClassificationResult = z.object({
  items: z.array(
    z.object({
      externalId: z
        .string()
        .describe("O mesmo externalId recebido na entrada para este post."),
      category: CategoryEnum,
      format: FormatEnum,
      objective: ObjectiveEnum,
    })
  ),
});
export type ClassificationResult = z.infer<typeof ClassificationResult>;

// --- Agente 3 — Analista de Viralização -----------------------------------
export const InsightResult = z.object({
  insights: z.array(
    z.object({
      externalId: z
        .string()
        .nullable()
        .describe(
          "externalId do post analisado; use null quando for um padrão geral, não um post específico."
        ),
      hook: z.string().describe("O gancho (resumo do que prende atenção)."),
      development: z.string().describe("Resumo estratégico do desenvolvimento."),
      cta: z.string().describe("A chamada para ação identificada."),
      narrative: z
        .string()
        .nullable()
        .describe("Narrativa (ex.: Problema→Solução, Antes→Depois, Lista)."),
      reason: z.string().describe("Motivo do sucesso / da performance."),
    })
  ),
});
export type InsightResult = z.infer<typeof InsightResult>;

// --- Agente 4 — Estrategista (gaps) ---------------------------------------
export const GapResult = z.object({
  gaps: z.array(
    z.object({
      theme: z.string(),
      reason: z.string(),
      potential: PotentialEnum,
      recommendation: z.string(),
    })
  ),
});
export type GapResult = z.infer<typeof GapResult>;

// --- Agente 5 — Copywriter (ideias + roteiros) ----------------------------
export const CopyResult = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      hook: z.string(),
      structure: z.string(),
      cta: z.string(),
      potential: PotentialEnum,
    })
  ),
  scripts: z.array(
    z.object({
      objective: z.string(),
      hook: z.string(),
      scenes: z
        .string()
        .describe("Cenas do roteiro, uma por linha (Cena 1, Cena 2, ...)."),
      cta: z.string(),
      caption: z.string().describe("Legenda sugerida para o post."),
    })
  ),
});
export type CopyResult = z.infer<typeof CopyResult>;

// --- Agente 6 — Trend Hunter ----------------------------------------------
export const TrendResult = z.object({
  trends: z.array(
    z.object({
      kind: z.enum(["assunto", "formato", "gancho", "narrativa"]),
      title: z.string(),
      description: z.string(),
    })
  ),
});
export type TrendResult = z.infer<typeof TrendResult>;

// --- Agente 7 — Report Generator ------------------------------------------
export const ReportResult = z.object({
  summary: z.string().describe("Resumo executivo em texto."),
  topContents: z.array(
    z.object({
      externalId: z.string().nullable(),
      why: z.string().describe("Por que este conteúdo se destacou."),
    })
  ),
  winningHooks: z.array(z.string()).describe("Ganchos vencedores."),
  strategicAlerts: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      impact: z.string(),
      action: z.string().describe("Ação recomendada."),
    })
  ),
  sevenDayPlan: z.array(
    z.object({
      day: z.number().describe("Dia (1 a 7)."),
      theme: z.string(),
      format: z.string(),
      hook: z.string(),
    })
  ),
});
export type ReportResult = z.infer<typeof ReportResult>;
