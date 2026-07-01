// Prepara os dados coletados (posts) em um formato compacto para os prompts.

export type PostLite = {
  externalId: string;
  competitor: string;
  type: string;
  caption: string;
  likes: number;
  comments: number;
  views: number;
};

// Serializa uma lista de posts como linhas curtas (economiza tokens).
export function serializePosts(posts: PostLite[]): string {
  if (posts.length === 0) return "(nenhum post coletado)";
  return posts
    .map(
      (p) =>
        `- [${p.externalId}] @${p.competitor} | ${p.type} | ${p.likes} curtidas, ${p.comments} coment., ${p.views} views\n  Legenda: ${truncate(p.caption, 400)}`
    )
    .join("\n");
}

// "Engajamento" simples para ranquear os posts que mais performaram.
export function engagement(p: PostLite): number {
  return p.likes + p.comments * 3;
}

export function topPosts(posts: PostLite[], n: number): PostLite[] {
  return [...posts].sort((a, b) => engagement(b) - engagement(a)).slice(0, n);
}

function truncate(s: string, max: number): string {
  const clean = (s ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}
