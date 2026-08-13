import { describe, expect, it } from "vitest";
import { buildCharacterShareUrl, buildTimelineShareUrl, readCharacterId, readTimelineOrder } from "./shareLinks";

describe("share links", () => {
  it("builds and restores a timeline order", () => {
    const url = buildTimelineShareUrl("https://example.test", "event");
    expect(url).toBe("https://example.test/timeline?order=event");
    expect(readTimelineOrder(new URL(url).search)).toBe("event");
  });

  it("builds and restores a character id", () => {
    const url = buildCharacterShareUrl("https://example.test", "/work/42", 901);
    expect(url).toBe("https://example.test/work/42?character=901");
    expect(readCharacterId(new URL(url).search)).toBe(901);
  });

  it("falls back safely for invalid parameters", () => {
    expect(readTimelineOrder("?order=unknown")).toBe("story");
    expect(readCharacterId("?character=0")).toBeNull();
    expect(readCharacterId("?character=not-a-number")).toBeNull();
  });
});
