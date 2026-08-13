import { eq, inArray } from "drizzle-orm";
import { getDb } from "../server/db";
import { universes, workRelations, works } from "../drizzle/schema";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const allWorks = await db.select({ id: works.id, title: works.title }).from(works).where(eq(works.source, "anilist"));
const links = await db.select({ from: workRelations.fromWorkId, to: workRelations.toWorkId }).from(workRelations);
const parent = new Map<number, number>(allWorks.map(work => [work.id, work.id]));
function find(x: number): number { const p = parent.get(x) ?? x; if (p === x) return x; const root = find(p); parent.set(x, root); return root; }
function union(a: number, b: number) { const ra = find(a); const rb = find(b); if (ra !== rb) parent.set(rb, ra); }
for (const link of links) union(link.from, link.to);
const groups = new Map<number, typeof allWorks>();
for (const work of allWorks) { const root = find(work.id); const group = groups.get(root) || []; group.push(work); groups.set(root, group); }
let linked = 0;
let universeCount = 0;
for (const group of groups.values()) {
  if (group.length < 2) continue;
  const name = `AniList Universe · ${group[0].title}`;
  const existing = await db.select({ id: universes.id }).from(universes).where(eq(universes.name, name)).limit(1);
  const universeId = existing[0]?.id ?? Number((await db.insert(universes).values({ name, description: `Linked universe containing ${group.length} related works.` }))[0].insertId);
  await db.update(works).set({ universeId }).where(inArray(works.id, group.map(work => work.id)));
  linked += group.length;
  universeCount++;
}
console.log(JSON.stringify({ works: allWorks.length, linked, universes: universeCount }));
