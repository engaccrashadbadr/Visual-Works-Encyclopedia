import { getDb } from "./db";
import { works } from "../drizzle/schema";

const TMDB_ENDPOINT = "https://api.themoviedb.org/3/trending/all/week";
export type TmdbSyncResult = { source: "tmdb"; enabled: boolean; processed: number; message?: string };

export function isTmdbEnabled() { return Boolean(process.env.TMDB_API_KEY); }

export async function syncTmdb(page = 1): Promise<TmdbSyncResult> {
  if (!isTmdbEnabled()) return { source: "tmdb", enabled: false, processed: 0, message: "TMDB_API_KEY is not configured; AniList remains the active source." };
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const response = await fetch(`${TMDB_ENDPOINT}?page=${page}`, { headers: { Accept: "application/json", Authorization: `Bearer ${process.env.TMDB_API_KEY}` } });
  if (!response.ok) throw new Error(`TMDB request failed: ${response.status}`);
  const json = await response.json() as { results?: Array<{ id: number; media_type?: string; title?: string; name?: string; overview?: string; poster_path?: string; backdrop_path?: string; vote_average?: number; first_air_date?: string; release_date?: string }> };
  let processed = 0;
  for (const item of json.results || []) {
    if (item.media_type !== "movie" && item.media_type !== "tv") continue;
    const title = item.title || item.name; if (!title) continue;
    const release = item.release_date || item.first_air_date;
    const payload = { externalId: String(item.id), source: "tmdb", title, type: item.media_type === "movie" ? "film" as const : "series" as const, releaseYear: release ? Number(release.slice(0, 4)) : null, score: item.vote_average ? String(item.vote_average.toFixed(2)) : null, summary: item.overview || null, coverImageUrl: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null, bannerImageUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null, popularity: 0 };
    await db.insert(works).values(payload).onDuplicateKeyUpdate({ set: { ...payload, updatedAt: new Date() } }); processed++;
  }
  return { source: "tmdb", enabled: true, processed };
}
