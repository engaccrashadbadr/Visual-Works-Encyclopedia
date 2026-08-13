import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { entities, entityRelations, franchises, InsertUser, syncRuns, universes, users, workEntities, workRelations, works } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date(); updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }

export async function listFeaturedWorks(limit = 8) { const db = await getDb(); if (!db) return []; return db.select().from(works).where(eq(works.isFeatured, 1)).orderBy(desc(works.popularity), desc(works.releaseYear)).limit(limit); }
export async function listPopularFranchises(limit = 6) { const db = await getDb(); if (!db) return []; return db.select().from(franchises).orderBy(desc(franchises.createdAt)).limit(limit); }

export async function searchWorks(input: { q?: string; type?: string; year?: number; studio?: string; minScore?: number; limit?: number }) {
  const db = await getDb(); if (!db) return [];
  const clauses = [];
  if (input.q) clauses.push(or(like(works.title, `%${input.q}%`), like(works.titleAr, `%${input.q}%`)));
  if (input.type && input.type !== "all") clauses.push(eq(works.type, input.type as typeof works.type.enumValues[number]));
  if (input.year) clauses.push(eq(works.releaseYear, input.year));
  if (input.studio) clauses.push(like(works.studio, `%${input.studio}%`));
  if (input.minScore) clauses.push(sql`${works.score} >= ${input.minScore}`);
  return db.select().from(works).where(clauses.length ? and(...clauses) : undefined).orderBy(desc(works.popularity), desc(works.score)).limit(input.limit ?? 24);
}

export async function getWorkDetails(id: number) {
  const db = await getDb(); if (!db) return null;
  const work = (await db.select().from(works).where(eq(works.id, id)).limit(1))[0]; if (!work) return null;
  const links = await db.select({ entity: entities, role: workEntities.role, isMain: workEntities.isMain }).from(workEntities).innerJoin(entities, eq(workEntities.entityId, entities.id)).where(eq(workEntities.workId, id));
  const relations = await db.select({ relation: workRelations, work: works }).from(workRelations).innerJoin(works, eq(workRelations.toWorkId, works.id)).where(eq(workRelations.fromWorkId, id));
  return { work, entities: links, relations };
}

export async function getEntityDetails(id: number) {
  const db = await getDb(); if (!db) return null;
  const entity = (await db.select().from(entities).where(eq(entities.id, id)).limit(1))[0]; if (!entity) return null;
  const appearances = await db.select({ work: works, role: workEntities.role }).from(workEntities).innerJoin(works, eq(workEntities.workId, works.id)).where(eq(workEntities.entityId, id));
  return { entity, appearances };
}

export async function compareEntities(ids: number[]) { const db = await getDb(); if (!db || ids.length === 0) return []; return db.select().from(entities).where(or(...ids.slice(0, 2).map(id => eq(entities.id, id)))); }
export async function searchCatalog(q: string, limit = 30) {
  const db = await getDb(); if (!db) return { works: [], characters: [] };
  const term = `%${q.trim()}%`;
  if (!q.trim()) return { works: [], characters: [] };
  const [workResults, characterResults] = await Promise.all([
    db.select().from(works).where(or(like(works.title, term), like(works.titleAr, term))).orderBy(desc(works.popularity), desc(works.score)).limit(limit),
    db.select().from(entities).where(and(eq(entities.kind, "character"), or(like(entities.name, term), like(entities.nameAr, term)))).orderBy(asc(entities.name)).limit(limit),
  ]);
  return { works: workResults, characters: characterResults };
}
export async function getUniverseGraph(universeId?: number) {
  const db = await getDb();
  if (!db) return { universes: [], nodes: [], edges: [] };
  const universeRows = await db.select().from(universes).orderBy(asc(universes.name)).limit(80);
  const selectedUniverseId = universeId ?? universeRows[0]?.id;
  if (!selectedUniverseId) return { universes: universeRows, nodes: [], edges: [] };
  const workRows = await db.select().from(works).where(eq(works.universeId, selectedUniverseId)).orderBy(desc(works.popularity)).limit(80);
  const workIds = workRows.map(work => work.id);
  if (!workIds.length) return { universes: universeRows, nodes: [], edges: [] };
  const appearanceRows = await db.select({ link: workEntities, entity: entities }).from(workEntities).innerJoin(entities, eq(workEntities.entityId, entities.id)).where(inArray(workEntities.workId, workIds)).limit(180);
  const entityIds = appearanceRows.map(row => row.entity.id);
  const relationRows = entityIds.length ? await db.select({ relation: entityRelations, entity: entities }).from(entityRelations).innerJoin(entities, eq(entityRelations.toEntityId, entities.id)).where(inArray(entityRelations.fromEntityId, entityIds)).limit(260) : [];
  const selectedUniverse = universeRows.find(universe => universe.id === selectedUniverseId);
  const nodes = [
    ...(selectedUniverse ? [{ id: `universe-${selectedUniverse.id}`, kind: "universe" as const, refId: selectedUniverse.id, label: selectedUniverse.name, labelAr: selectedUniverse.nameAr, description: selectedUniverse.description }] : []),
    ...workRows.map(work => ({ id: `work-${work.id}`, kind: "work" as const, refId: work.id, label: work.title, labelAr: work.titleAr, imageUrl: work.coverImageUrl, type: work.type, score: work.score })),
    ...appearanceRows.map(row => ({ id: `entity-${row.entity.id}`, kind: row.entity.kind, refId: row.entity.id, label: row.entity.name, labelAr: row.entity.nameAr, imageUrl: row.entity.imageUrl, role: row.link.role, isMain: row.link.isMain })),
    ...relationRows.map(row => ({ id: `relation-${row.relation.id}`, kind: "relation" as const, refId: row.relation.id, label: row.relation.label || row.relation.relationType, labelAr: row.relation.label || row.relation.relationType, relationType: row.relation.relationType })),
  ];
  const edges = [
    ...(selectedUniverse ? workRows.map(work => ({ id: `universe-work-${selectedUniverse.id}-${work.id}`, source: `universe-${selectedUniverse.id}`, target: `work-${work.id}`, type: "universe_work", label: "universe_work" })) : []),
    ...appearanceRows.map(row => ({ id: `appearance-${row.link.workId}-${row.link.entityId}`, source: `work-${row.link.workId}`, target: `entity-${row.entity.id}`, type: "appearance", label: row.link.role || "appearance" })),
    ...relationRows.flatMap(row => [
      { id: `relation-from-${row.relation.id}`, source: `entity-${row.relation.fromEntityId}`, target: `relation-${row.relation.id}`, type: row.relation.relationType, label: row.relation.label || row.relation.relationType },
      { id: `relation-to-${row.relation.id}`, source: `relation-${row.relation.id}`, target: `entity-${row.entity.id}`, type: row.relation.relationType, label: row.relation.label || row.relation.relationType },
    ]),
  ];
  return { universes: universeRows, selectedUniverseId, nodes, edges };
}

export async function getEntityRelations(id: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ relation: entityRelations, entity: entities }).from(entityRelations).innerJoin(entities, eq(entityRelations.toEntityId, entities.id)).where(eq(entityRelations.fromEntityId, id));
}
export async function listUniverses() { const db = await getDb(); if (!db) return []; return db.select().from(universes).orderBy(asc(universes.name)); }
export async function createWork(input: any) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(works).values(input); return { id: Number(result[0].insertId) }; }
export async function updateWork(id: number, input: any) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(works).set(input).where(eq(works.id, id)); return { success: true }; }
export async function deleteWork(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(works).where(eq(works.id, id)); return { success: true }; }
export async function createEntity(input: any) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(entities).values(input); return { id: Number(result[0].insertId) }; }
export async function updateEntity(id: number, input: any) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(entities).set(input).where(eq(entities.id, id)); return { success: true }; }
export async function deleteEntity(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(entities).where(eq(entities.id, id)); return { success: true }; }
export async function setWorkImage(id: number, url: string) { return updateWork(id, { coverImageUrl: url }); }
export async function setEntityImage(id: number, url: string) { return updateEntity(id, { imageUrl: url }); }
export async function getLatestSync(source = "anilist") { const db = await getDb(); if (!db) return null; return (await db.select().from(syncRuns).where(eq(syncRuns.source, source)).orderBy(desc(syncRuns.id)).limit(1))[0] || null; }
export async function getFranchiseOrder(franchiseId: number, order: "chronological" | "release") { const db = await getDb(); if (!db) return []; const rows = await db.select({ relation: workRelations, work: works }).from(workRelations).innerJoin(works, eq(workRelations.toWorkId, works.id)).where(eq(works.franchiseId, franchiseId)); return rows.sort((a, b) => ((order === "chronological" ? a.relation.chronologicalOrder : a.relation.releaseOrder) ?? 999) - ((order === "chronological" ? b.relation.chronologicalOrder : b.relation.releaseOrder) ?? 999)).map(row => ({ ...row.work, relationType: row.relation.relationType, relationshipLabel: ({ sequel: "تكملة / Sequel", side_story: "قصة جانبية / Side story", remake: "إعادة إنتاج / Remake", reboot: "إعادة تشغيل / Reboot", prequel: "تمهيد / Prequel", spin_off: "عمل فرعي / Spin-off" } as Record<string, string>)[row.relation.relationType] })); }
