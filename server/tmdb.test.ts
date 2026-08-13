import { describe, expect, it } from "vitest";
import { isTmdbEnabled, syncTmdb } from "./tmdb";

describe("tmdb adapter", () => {
  it("stays disabled without a key", async () => {
    const previous = process.env.TMDB_API_KEY;
    delete process.env.TMDB_API_KEY;
    expect(isTmdbEnabled()).toBe(false);
    await expect(syncTmdb()).resolves.toMatchObject({ enabled: false, processed: 0 });
    if (previous) process.env.TMDB_API_KEY = previous;
  });
});
