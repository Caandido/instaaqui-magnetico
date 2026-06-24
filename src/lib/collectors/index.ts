// Seletor da fonte de coleta. Troque aqui para plugar outra fonte no futuro.
import type { CollectorAdapter } from "./types";
import { apifyAdapter } from "./apify";

export function getCollector(): CollectorAdapter {
  // No futuro: escolher por env (ex.: COLLECTOR_PROVIDER) entre apify/outras.
  return apifyAdapter;
}

export * from "./types";
