// Persiste o resultado de uma coleta (RawProfile + RawPost[]) no banco,
// atualizando o Competitor e fazendo upsert dos Content.

import { db } from "@/lib/db";
import type { CollectResult } from "./types";

export async function persistCollectResult(
  competitorId: string,
  result: CollectResult
): Promise<number> {
  const { profile, posts } = result;

  await db.competitor.update({
    where: { id: competitorId },
    data: {
      displayName: profile.displayName ?? undefined,
      bio: profile.bio ?? undefined,
      link: profile.link ?? undefined,
      followers: profile.followers ?? undefined,
      following: profile.following ?? undefined,
      postsCount: profile.postsCount ?? undefined,
      profilePicUrl: profile.profilePicUrl ?? undefined,
      lastCollectedAt: new Date(),
    },
  });

  let count = 0;
  for (const post of posts) {
    await db.content.upsert({
      where: {
        competitorId_externalId: { competitorId, externalId: post.externalId },
      },
      create: {
        competitorId,
        externalId: post.externalId,
        type: post.type,
        caption: post.caption,
        url: post.url,
        mediaUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
        likes: post.likes,
        comments: post.comments,
        views: post.views,
        postedAt: post.postedAt,
      },
      update: {
        type: post.type,
        caption: post.caption,
        likes: post.likes,
        comments: post.comments,
        views: post.views,
      },
    });
    count++;
  }

  return count;
}
