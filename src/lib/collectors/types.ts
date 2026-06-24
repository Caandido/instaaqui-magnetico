// Contrato da camada de coleta (plugável).
// Hoje a implementação é a Apify; amanhã pode ser outra fonte que siga este contrato.

export type RawProfile = {
  handle: string;
  displayName?: string | null;
  bio?: string | null;
  link?: string | null;
  followers?: number | null;
  following?: number | null;
  postsCount?: number | null;
  profilePicUrl?: string | null;
};

export type RawContentType =
  | "REELS"
  | "CAROUSEL"
  | "IMAGE"
  | "VIDEO"
  | "STORY"
  | "UNKNOWN";

export type RawPost = {
  externalId: string;
  type: RawContentType;
  caption?: string | null;
  url?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  likes?: number | null;
  comments?: number | null;
  views?: number | null;
  postedAt?: Date | null;
};

export type CollectResult = { profile: RawProfile; posts: RawPost[] };

export type StartRunOptions = {
  maxPosts: number;
  webhookUrl: string; // URL pública que a fonte chama ao terminar o run
};

export interface CollectorAdapter {
  /** Inicia a coleta de forma assíncrona (não espera terminar). Retorna o id do run. */
  startRun(handle: string, opts: StartRunOptions): Promise<{ runId: string }>;

  /** Lê os resultados de um run já finalizado e devolve perfil + posts normalizados. */
  fetchRunResult(
    datasetId: string,
    handle: string,
    maxPosts: number
  ): Promise<CollectResult>;
}
