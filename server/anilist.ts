import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { entities, entityRelations, syncRuns, workEntities, workRelations, works } from "../drizzle/schema";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const query = `query ($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: $sort, type: $type) {
      id title { romaji english native } type format startDate { year }
      studios(isMain: true) { nodes { name } }
      averageScore description episodes duration
      coverImage { extraLarge large } bannerImage genres popularity
      relations { edges { relationType node { id type format } } }
      characters(perPage: 10, sort: ROLE) {
        edges { role node { id name { full native } image { large medium } description } }
      }
    }
  }
}`;

type AniCharacter = {
  id: number;
  name?: { full?: string; native?: string };
  image?: { large?: string; medium?: string };
  description?: string;
};
type AniMedia = {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  type?: string;
  format?: string;
  startDate?: { year?: number };
  studios?: { nodes?: { name: string }[] };
  averageScore?: number;
  description?: string;
  episodes?: number;
  duration?: number;
  coverImage?: { extraLarge?: string; large?: string };
  bannerImage?: string;
  popularity?: number;
  relations?: { edges?: { relationType?: string; node?: { id: number; type?: string; format?: string } }[] };
  characters?: { edges?: { role?: string; node?: AniCharacter }[] };
};

type AniPage = { data?: { Page?: { pageInfo?: { hasNextPage?: boolean }; media?: AniMedia[] } } };
type AniMediaType = "ANIME" | "MANGA";
export type { AniMediaType };

export function cleanHtml(value?: string) { return value?.replace(/<[^>]*>/g, "").replace(/\n+/g, " ").trim() || null; }
export function mapType(format?: string, mediaType?: AniMediaType): "anime" | "manga" | "film" | "series" | "ova" | "animation" { if (mediaType === "MANGA" || format === "MANGA" || format === "NOVEL" || format === "ONE_SHOT") return "manga"; if (format === "MOVIE") return "film"; if (format === "OVA" || format === "ONA") return "ova"; if (format === "SPECIAL") return "animation"; return "anime"; }
export function mapRelation(value?: string) { return relationType(value); }
export function buildCharacterLinks(workId: number, edges: { id: number; role?: string }[]) { return edges.map(edge => ({ workId, entityId: edge.id, role: edge.role || "supporting", isMain: edge.role === "MAIN" ? 1 : 0 })); }
function relationType(value?: string): "sequel" | "side_story" | "remake" | "reboot" | "prequel" | "spin_off" | null {
  const map: Record<string, "sequel" | "side_story" | "remake" | "reboot" | "prequel" | "spin_off"> = { SEQUEL: "sequel", SIDE_STORY: "side_story", REMAKE: "remake", REBOOT: "reboot", PREQUEL: "prequel", SPIN_OFF: "spin_off" };
  return value ? map[value] || null : null;
}

async function getWorkId(db: any, externalId: string) { return (await db.select({ id: works.id }).from(works).where(and(eq(works.source, "anilist"), eq(works.externalId, externalId))).limit(1))[0]?.id as number | undefined; }
async function getEntityId(db: any, externalId: string) { return (await db.select({ id: entities.id }).from(entities).where(and(eq(entities.source, "anilist"), eq(entities.externalId, externalId))).limit(1))[0]?.id as number | undefined; }

async function saveCharacters(db: any, workId: number, characters: AniMedia["characters"]) {
  const edges = (characters?.edges || []).filter(edge => edge.node?.id && edge.node.name?.full).slice(0, 10);
  if (!edges.length) return;
  const payloads = edges.map(edge => ({ externalId: String(edge.node!.id), source: "anilist", kind: "character" as const, name: edge.node!.name!.full!, nameAr: edge.node!.name!.native || null, imageUrl: edge.node!.image?.large || edge.node!.image?.medium || null, description: cleanHtml(edge.node!.description), relationships: null }));
  await db.insert(entities).values(payloads).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  const externalIds = payloads.map(item => item.externalId);
  const rows = await db.select({ id: entities.id, externalId: entities.externalId }).from(entities).where(and(eq(entities.source, "anilist"), inArray(entities.externalId, externalIds)));
  const byExternal = new Map(rows.map((row: { id: number; externalId: string | null }) => [row.externalId, row.id]));
  const links: { workId: number; entityId: number; role: string; isMain: number }[] = edges.flatMap(edge => { const id = byExternal.get(String(edge.node!.id)); return typeof id === "number" ? [{ workId, entityId: id, role: edge.role || "supporting", isMain: edge.role === "MAIN" ? 1 : 0 }] : []; });
  if (links.length) await db.insert(workEntities).values(links).onDuplicateKeyUpdate({ set: { role: "supporting" } });
  const ids: number[] = links.map(link => link.entityId);
  const relationRows = [] as { fromEntityId: number; toEntityId: number; relationType: "co_appearance"; label: string }[];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    relationRows.push({ fromEntityId: ids[i], toEntityId: ids[j], relationType: "co_appearance", label: "Shared appearance / ظهور مشترك" });
    relationRows.push({ fromEntityId: ids[j], toEntityId: ids[i], relationType: "co_appearance", label: "Shared appearance / ظهور مشترك" });
  }
  if (relationRows.length) await db.insert(entityRelations).values(relationRows).onDuplicateKeyUpdate({ set: { label: "Shared appearance / ظهور مشترك" } });
}

export async function syncAniList(page = 1, perPage = 25) {
  return syncAniListMedia(page, perPage, "ANIME");
}

export async function syncAniListMedia(page = 1, perPage = 25, mediaType: AniMediaType = "ANIME", fromYear = 1970, toYear = 2026) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const run = await db.insert(syncRuns).values({ source: "anilist", status: "running", itemsProcessed: 0 }); const runId = Number(run[0].insertId);
  try {
    const response = await fetch(ANILIST_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables: { page, perPage: Math.min(Math.max(perPage, 1), 50), type: mediaType, sort: mediaType === "MANGA" ? ["START_DATE_DESC"] : ["POPULARITY_DESC"] } }) });
    if (!response.ok) throw new Error(`AniList request failed: ${response.status}`);
    const json = await response.json() as AniPage;
    const media = (json.data?.Page?.media || []).filter(item => {
      const year = item.startDate?.year;
      return typeof year !== "number" || (year >= fromYear && year <= toYear);
    });
    for (const item of media) {
      const title = item.title.english || item.title.romaji || item.title.native || `AniList #${item.id}`;
      const payload = { externalId: String(item.id), source: "anilist", title, titleAr: item.title.native || null, type: mapType(item.format, mediaType), releaseYear: item.startDate?.year || null, studio: item.studios?.nodes?.[0]?.name || null, score: item.averageScore ? String((item.averageScore / 10).toFixed(2)) : null, summary: cleanHtml(item.description), episodeCount: item.episodes || null, durationMinutes: item.duration || null, coverImageUrl: item.coverImage?.extraLarge || item.coverImage?.large || null, bannerImageUrl: item.bannerImage || null, popularity: item.popularity || 0 };
      await db.insert(works).values(payload).onDuplicateKeyUpdate({ set: { ...payload, updatedAt: new Date() } });
      const workId = await getWorkId(db, String(item.id));
      if (!workId) continue;
      await saveCharacters(db, workId, item.characters);
      const relationLinks = (item.relations?.edges || []).flatMap(edge => { const targetType = relationType(edge.relationType); return targetType && edge.node?.id ? [{ fromWorkId: workId, toWorkExternalId: String(edge.node.id), relationType: targetType }] : []; });
      for (const link of relationLinks) {
        const targetWorkId = await getWorkId(db, link.toWorkExternalId);
        if (targetWorkId) {
          const existing = await db.select({ id: workRelations.id }).from(workRelations).where(and(eq(workRelations.fromWorkId, link.fromWorkId), eq(workRelations.toWorkId, targetWorkId), eq(workRelations.relationType, link.relationType))).limit(1);
          if (!existing.length) await db.insert(workRelations).values({ fromWorkId: link.fromWorkId, toWorkId: targetWorkId, relationType: link.relationType });
        }
      }
    }
    await db.update(syncRuns).set({ status: "success", itemsProcessed: media.length, finishedAt: new Date() }).where(eq(syncRuns.id, runId));
    return { source: "anilist", page, processed: media.length, hasNextPage: Boolean(json.data?.Page?.pageInfo?.hasNextPage) };
  } catch (error) {
    await db.update(syncRuns).set({ status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error", finishedAt: new Date() }).where(eq(syncRuns.id, runId));
    throw error;
  }
}

export async function syncAniListCatalog(target = 2000) {
  const perPage = 50;
  const pages = Math.ceil(target / perPage);
  let processed = 0;
  for (let page = 1; page <= pages; page++) {
    const result = await syncAniList(page, perPage);
    processed += result.processed;
    if (!result.hasNextPage || result.processed === 0) break;
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  return { target, processed, pages };
}

export async function syncAniListMediaCatalog(mediaType: AniMediaType, target = 2000, fromYear = 1970, toYear = 2026, startPage = 1) {
  const perPage = 50;
  const pages = Math.ceil(target / perPage);
  let processed = 0;
  for (let page = startPage; page < startPage + pages; page++) {
    const result = await syncAniListMedia(page, perPage, mediaType, fromYear, toYear);
    processed += result.processed;
    if (!result.hasNextPage || result.processed === 0) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return { mediaType, target, fromYear, toYear, processed, pages, startPage };
}

const relationsQuery = `query ($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(sort: POPULARITY_DESC, type: ANIME) { id relations { edges { relationType node { id } } } } } }`;

export async function syncAniListRelationsPage(page = 1, perPage = 50) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const response = await fetch(ANILIST_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query: relationsQuery, variables: { page, perPage } }) });
  if (!response.ok) throw new Error(`AniList relations request failed: ${response.status}`);
  const json = await response.json() as AniPage;
  let inserted = 0;
  for (const item of json.data?.Page?.media || []) {
    const fromWorkId = await getWorkId(db, String(item.id));
    if (!fromWorkId) continue;
    for (const edge of item.relations?.edges || []) {
      const targetType = relationType(edge.relationType);
      const toWorkId = edge.node?.id ? await getWorkId(db, String(edge.node.id)) : undefined;
      if (!targetType || !toWorkId) continue;
      const existing = await db.select({ id: workRelations.id }).from(workRelations).where(and(eq(workRelations.fromWorkId, fromWorkId), eq(workRelations.toWorkId, toWorkId), eq(workRelations.relationType, targetType))).limit(1);
      if (!existing.length) { await db.insert(workRelations).values({ fromWorkId, toWorkId, relationType: targetType }); inserted++; }
    }
  }
  return { page, inserted };
}
