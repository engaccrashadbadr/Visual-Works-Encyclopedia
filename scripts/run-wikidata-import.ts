import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../server/db";
import { entities, entityRelations, syncRuns, workEntities, workRelations, works } from "../drizzle/schema";

const ENDPOINT = "https://query.wikidata.org/sparql";
const offset = Number(process.argv[2] || 0);
const limit = Math.min(Math.max(Number(process.argv[3] || 100), 1), 500);
const fromYear = Number(process.argv[4] || 1970);
const toYear = Number(process.argv[5] || 2026);
const className = process.argv[6] || "film";
const classQid = className === "series" ? "Q5398426" : "Q11424";

type SparqlRow = { item: { value: string }; itemLabel?: { value: string }; date?: { value: string }; type?: { value: string }; typeLabel?: { value: string } };
type SparqlResponse = { results?: { bindings?: SparqlRow[] } };
type RelationRow = { item: { value: string }; related: { value: string }; relation: { value: string } };
type CharacterRow = { item: { value: string }; character: { value: string }; characterLabel?: { value: string } };

function qid(uri: string) { return uri.split("/").pop() || uri; }
function year(value?: string) { const parsed = value ? Number(value.slice(0, 4)) : null; return parsed && parsed >= fromYear && parsed <= toYear ? parsed : null; }
function esc(value: string) { return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
async function queryWikidata<T>(query: string): Promise<T[]> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, { headers: { Accept: "application/sparql-results+json", "User-Agent": "VisualWorksEncyclopedia/1.0 (catalog import)" }, signal: controller.signal });
      if (response.ok) {
        const json = await response.json() as SparqlResponse;
        return (json.results?.bindings || []) as T[];
      }
      lastStatus = response.status;
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    } catch (error) {
      lastStatus = error instanceof DOMException && error.name === "AbortError" ? 408 : 599;
    } finally {
      clearTimeout(timer);
    }
    await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  throw new Error(`Wikidata request failed: ${lastStatus}`);
}

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const run = await db.insert(syncRuns).values({ source: "wikidata", status: "running", itemsProcessed: 0 });
const runId = Number(run[0].insertId);
try {
  const workQuery = `SELECT ?item ?itemLabel ?date WHERE {
    ?item wdt:P31 wd:${classQid}; wdt:P577 ?date.
    ?item rdfs:label ?itemLabel.
    FILTER(lang(?itemLabel) = "en")
    FILTER(YEAR(?date) >= ${fromYear} && YEAR(?date) <= ${toYear})
  } ORDER BY ?date ?item OFFSET ${offset} LIMIT ${limit}`;
  const rows = await queryWikidata<SparqlRow>(workQuery);
  const unique = new Map(rows.map(row => [qid(row.item.value), row]));
  let worksInserted = 0;
  for (const [id, row] of unique) {
    const releaseYear = year(row.date?.value);
    if (!releaseYear || !row.itemLabel?.value) continue;
    const type = className === "series" ? "series" : "film";
    await db.insert(works).values({ externalId: id, source: "wikidata", title: row.itemLabel.value.slice(0, 500), type, releaseYear, summary: `Wikidata item ${id}`, popularity: 0 }).onDuplicateKeyUpdate({ set: { title: row.itemLabel.value.slice(0, 500), type, releaseYear, updatedAt: new Date() } });
    worksInserted++;
  }

  const ids = [...unique.keys()];
  const workRows = ids.length ? await db.select({ id: works.id, externalId: works.externalId }).from(works).where(and(eq(works.source, "wikidata"), inArray(works.externalId, ids))) : [];
  const workByExternal = new Map(workRows.map(row => [row.externalId!, row.id]));
  const relationsQuery = ids.length ? `SELECT ?item ?related ?relation WHERE {
    VALUES ?item { ${ids.map(id => `wd:${id}`).join(" ")} }
    { ?item wdt:P155 ?related. BIND("prequel" AS ?relation) }
    UNION { ?item wdt:P156 ?related. BIND("sequel" AS ?relation) }
  }` : "SELECT * WHERE { FILTER(false) }";
  const relationRows = await queryWikidata<RelationRow>(relationsQuery);
  let relationsInserted = 0;
  for (const row of relationRows) {
    const from = workByExternal.get(qid(row.item.value));
    const to = workByExternal.get(qid(row.related.value));
    const relationType = row.relation.value as "prequel" | "sequel";
    if (!from || !to || from === to || !["prequel", "sequel"].includes(relationType)) continue;
    const existing = await db.select({ id: workRelations.id }).from(workRelations).where(and(eq(workRelations.fromWorkId, from), eq(workRelations.toWorkId, to), eq(workRelations.relationType, relationType))).limit(1);
    if (!existing.length) { await db.insert(workRelations).values({ fromWorkId: from, toWorkId: to, relationType }); relationsInserted++; }
  }

  const characterQuery = ids.length ? `SELECT ?item ?character ?characterLabel WHERE {
    VALUES ?item { ${ids.map(id => `wd:${id}`).join(" ")} }
    ?item wdt:P161 ?character.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ar". }
  } LIMIT ${Math.min(limit * 5, 500)}` : "SELECT * WHERE { FILTER(false) }";
  const characterRows = await queryWikidata<CharacterRow>(characterQuery);
  const characterIds = [...new Set(characterRows.map(row => qid(row.character.value)))].filter(Boolean);
  for (const characterId of characterIds) {
    const row = characterRows.find(item => qid(item.character.value) === characterId);
    const name = row?.characterLabel?.value;
    if (!name) continue;
    await db.insert(entities).values({ externalId: characterId, source: "wikidata", kind: "character", name: name.slice(0, 255), description: `Wikidata item ${characterId}` }).onDuplicateKeyUpdate({ set: { name: name.slice(0, 255), updatedAt: new Date() } });
  }
  const entityRows = characterIds.length ? await db.select({ id: entities.id, externalId: entities.externalId }).from(entities).where(and(eq(entities.source, "wikidata"), inArray(entities.externalId, characterIds))) : [];
  const entityByExternal = new Map(entityRows.map(row => [row.externalId!, row.id]));
  let appearancesInserted = 0;
  for (const row of characterRows) {
    const workId = workByExternal.get(qid(row.item.value));
    const entityId = entityByExternal.get(qid(row.character.value));
    if (!workId || !entityId) continue;
    const existing = await db.select({ id: workEntities.id }).from(workEntities).where(and(eq(workEntities.workId, workId), eq(workEntities.entityId, entityId))).limit(1);
    if (!existing.length) { await db.insert(workEntities).values({ workId, entityId, role: "cast", isMain: 0 }); appearancesInserted++; }
  }
  const processed = worksInserted;
  await db.update(syncRuns).set({ status: "success", itemsProcessed: processed, finishedAt: new Date() }).where(eq(syncRuns.id, runId));
  console.log(JSON.stringify({ source: "wikidata", className, offset, limit, fromYear, toYear, processed, relationsInserted, characters: characterIds.length, appearancesInserted, nextOffset: offset + limit }));
} catch (error) {
  await db.update(syncRuns).set({ status: "failed", errorMessage: error instanceof Error ? error.message : String(error), finishedAt: new Date() }).where(eq(syncRuns.id, runId));
  throw error;
}
