import { getDb } from "./db";
import { works } from "../drizzle/schema";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const query = `query ($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { pageInfo { hasNextPage } media(sort: POPULARITY_DESC, type: ANIME) { id title { romaji english native } type format startDate { year } studios(isMain: true) { nodes { name } } averageScore description episodes duration coverImage { extraLarge large } bannerImage genres popularity } } }`;

type AniMedia = { id: number; title: { romaji?: string; english?: string; native?: string }; type?: string; format?: string; startDate?: { year?: number }; studios?: { nodes?: { name: string }[] }; averageScore?: number; description?: string; episodes?: number; duration?: number; coverImage?: { extraLarge?: string; large?: string }; bannerImage?: string; popularity?: number; genres?: string[] };
export function cleanHtml(value?: string) { return value?.replace(/<[^>]*>/g, "").replace(/\n+/g, " ").trim() || null; }
export function mapType(format?: string): "anime" | "film" | "series" | "ova" | "animation" { if (format === "MOVIE") return "film"; if (format === "OVA" || format === "ONA") return "ova"; if (format === "SPECIAL") return "animation"; return "anime"; }

export async function syncAniList(page = 1, perPage = 25) {
  const response = await fetch(ANILIST_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables: { page, perPage } }) });
  if (!response.ok) throw new Error(`AniList request failed: ${response.status}`);
  const json = await response.json() as { data?: { Page?: { pageInfo?: { hasNextPage?: boolean }; media?: AniMedia[] } } };
  const media = json.data?.Page?.media || []; const db = await getDb(); if (!db) throw new Error("Database unavailable");
  for (const item of media) {
    const title = item.title.english || item.title.romaji || item.title.native || `AniList #${item.id}`;
    const studio = item.studios?.nodes?.[0]?.name || null;
    const payload = { externalId: String(item.id), source: "anilist", title, titleAr: item.title.native || null, type: mapType(item.format), releaseYear: item.startDate?.year || null, studio, score: item.averageScore ? String((item.averageScore / 10).toFixed(2)) : null, summary: cleanHtml(item.description), episodeCount: item.episodes || null, durationMinutes: item.duration || null, coverImageUrl: item.coverImage?.extraLarge || item.coverImage?.large || null, bannerImageUrl: item.bannerImage || null, popularity: item.popularity || 0 };
    await db.insert(works).values(payload).onDuplicateKeyUpdate({ set: { ...payload, updatedAt: new Date() } });
  }
  return { source: "anilist", page, processed: media.length, hasNextPage: Boolean(json.data?.Page?.pageInfo?.hasNextPage) };
}
