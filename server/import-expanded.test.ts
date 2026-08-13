import { describe, expect, it } from "vitest";
import { and, count, eq, like } from "drizzle-orm";
import { getDb } from "./db";
import { entities, entityRelations, workEntities, workRelations, works } from "../drizzle/schema";
import { buildCharacterLinks, mapRelation } from "./anilist";

describe("expanded AniList catalog", () => {
  it("builds role-aware character appearance links", () => {
    expect(buildCharacterLinks(10, [{ id: 20, role: "MAIN" }, { id: 21 }])).toEqual([
      { workId: 10, entityId: 20, role: "MAIN", isMain: 1 },
      { workId: 10, entityId: 21, role: "supporting", isMain: 0 },
    ]);
  });

  it("maps source relationships to explicit universe relationship labels", () => {
    expect(mapRelation("SEQUEL")).toBe("sequel");
    expect(mapRelation("SIDE_STORY")).toBe("side_story");
    expect(mapRelation("REMAKE")).toBe("remake");
  });

  it.runIf(Boolean(process.env.DATABASE_URL))("contains the expanded target and persisted links", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const workCount = await db!.select({ value: count() }).from(works).where(eq(works.source, "anilist"));
    const mangaCount = await db!.select({ value: count() }).from(works).where(and(eq(works.source, "anilist"), eq(works.type, "manga")));
    const roleCount = await db!.select({ value: count() }).from(workEntities).where(and(eq(workEntities.role, "MAIN"), eq(workEntities.isMain, 1)));
    const relationCount = await db!.select({ value: count() }).from(workRelations);
    const characterRelationCount = await db!.select({ value: count() }).from(entityRelations).where(eq(entityRelations.relationType, "co_appearance"));
    expect(Number(workCount[0]?.value)).toBeGreaterThanOrEqual(2000);
    expect(Number(mangaCount[0]?.value)).toBeGreaterThanOrEqual(500);
    expect(Number(roleCount[0]?.value)).toBeGreaterThan(0);
    expect(Number(relationCount[0]?.value)).toBeGreaterThan(0);
    expect(Number(characterRelationCount[0]?.value)).toBeGreaterThan(0);
  });

  it.runIf(Boolean(process.env.DATABASE_URL))("supports substring search across works and characters", async () => {
    const db = await getDb();
    const workMatch = await db!.select({ title: works.title }).from(works).where(like(works.title, "%naruto%"));
    const characterMatch = await db!.select({ name: entities.name }).from(entities).where(and(eq(entities.kind, "character"), like(entities.name, "%naruto%")));
    expect(workMatch.length + characterMatch.length).toBeGreaterThan(0);
  });
});
