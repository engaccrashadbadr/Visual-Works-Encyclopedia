import { describe, expect, it } from "vitest";
import { cleanHtml, mapType } from "./anilist";

describe("AniList adapter", () => {
  it("maps external formats to catalog types", () => {
    expect(mapType("MOVIE")).toBe("film");
    expect(mapType("TV")).toBe("anime");
    expect(mapType("OVA")).toBe("ova");
    expect(mapType("SPECIAL")).toBe("animation");
    expect(mapType("MANGA", "MANGA")).toBe("manga");
  });

  it("removes HTML from imported summaries", () => {
    expect(cleanHtml("<p>Hello <b>world</b></p>\nNext")).toBe("Hello world Next");
    expect(cleanHtml(undefined)).toBeNull();
  });

  it("reports a sync failure when the database is unavailable", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const { syncAniList } = await import("./anilist");
    await expect(syncAniList()).rejects.toThrow("Database unavailable");
    if (previous) process.env.DATABASE_URL = previous;
  });
});
