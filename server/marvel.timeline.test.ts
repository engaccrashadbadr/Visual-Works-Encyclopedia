import { describe, expect, it } from "vitest";
import { listMarvelTimeline } from "./db";

describe("Marvel timeline contract", () => {
  it("returns imported Marvel works in story order", async () => {
    const rows = await listMarvelTimeline("story");
    expect(rows.length).toBeGreaterThanOrEqual(80);
    expect(rows[0]?.brand).toBe("marvel");
    expect(rows[0]?.source).toBe("marvel");
    expect(rows[0]?.storyOrder).toBeLessThanOrEqual(rows.at(-1)?.storyOrder ?? 9999);
  });

  it("supports release-year ordering without changing the catalog scope", async () => {
    const rows = await listMarvelTimeline("release");
    expect(rows.length).toBeGreaterThanOrEqual(80);
    expect(rows.every(row => row.brand === "marvel")).toBe(true);
    const years = rows.map(row => row.releaseYear ?? 9999);
    expect(years[0]).toBeLessThanOrEqual(years.at(-1) ?? 9999);
  });
});
