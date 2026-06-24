// Adapter de coleta usando a Apify (Actor apify/instagram-scraper).
// Estratégia: resultsType "details" devolve o perfil + os posts recentes (latestPosts)
// numa única chamada — econômico em créditos do plano grátis.

import { ApifyClient } from "apify-client";
import type {
  CollectorAdapter,
  CollectResult,
  RawContentType,
  RawPost,
  RawProfile,
  StartRunOptions,
} from "./types";

const ACTOR_ID = "apify/instagram-scraper";

function client(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN não configurado.");
  return new ApifyClient({ token });
}

function toInt(v: unknown): number | null {
  const n = typeof v === "string" ? parseInt(v, 10) : (v as number);
  return Number.isFinite(n) ? (n as number) : null;
}

function mapType(item: Record<string, unknown>): RawContentType {
  const type = String(item.type ?? "").toLowerCase();
  const product = String(item.productType ?? "").toLowerCase();
  if (product === "clips" || item.isReel === true) return "REELS";
  if (type === "sidecar") return "CAROUSEL";
  if (type === "video") return "VIDEO";
  if (type === "image") return "IMAGE";
  return "UNKNOWN";
}

function mapPost(item: Record<string, unknown>): RawPost | null {
  const shortCode = (item.shortCode ?? item.code ?? item.id) as string | undefined;
  if (!shortCode) return null;
  const ts = item.timestamp as string | undefined;
  return {
    externalId: String(shortCode),
    type: mapType(item),
    caption: (item.caption as string) ?? null,
    url: (item.url as string) ?? `https://www.instagram.com/p/${shortCode}/`,
    mediaUrl: (item.displayUrl as string) ?? null,
    thumbnailUrl: (item.displayUrl as string) ?? null,
    likes: toInt(item.likesCount),
    comments: toInt(item.commentsCount),
    views: toInt(item.videoViewCount ?? item.videoPlayCount),
    postedAt: ts ? new Date(ts) : null,
  };
}

function mapProfile(item: Record<string, unknown>, handle: string): RawProfile {
  return {
    handle: (item.username as string) ?? handle,
    displayName: (item.fullName as string) ?? null,
    bio: (item.biography as string) ?? null,
    link: (item.externalUrl as string) ?? null,
    followers: toInt(item.followersCount),
    following: toInt(item.followsCount),
    postsCount: toInt(item.postsCount),
    profilePicUrl:
      (item.profilePicUrlHD as string) ?? (item.profilePicUrl as string) ?? null,
  };
}

export const apifyAdapter: CollectorAdapter = {
  async startRun(handle: string, opts: StartRunOptions) {
    const input = {
      directUrls: [`https://www.instagram.com/${handle.replace(/^@/, "")}/`],
      resultsType: "details",
      resultsLimit: opts.maxPosts,
      addParentData: false,
    };

    const run = await client()
      .actor(ACTOR_ID)
      .start(input, {
        webhooks: [
          {
            eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED"],
            requestUrl: opts.webhookUrl,
          },
        ],
      });

    return { runId: run.id };
  },

  async fetchRunResult(
    datasetId: string,
    handle: string,
    maxPosts: number
  ): Promise<CollectResult> {
    const { items } = await client().dataset(datasetId).listItems();
    const detail = (items[0] ?? {}) as Record<string, unknown>;

    const profile = mapProfile(detail, handle.replace(/^@/, ""));

    const latest = (detail.latestPosts as Record<string, unknown>[]) ?? [];
    const posts = latest
      .slice(0, maxPosts)
      .map(mapPost)
      .filter((p): p is RawPost => p !== null);

    return { profile, posts };
  },
};
