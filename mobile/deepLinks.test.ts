import { describe, expect, it } from "vitest";
import { PRODUCTION_URL, resolveWebUrl } from "./deepLinks";

describe("mobile deep-link restoration", () => {
  it("maps a visualworks scheme URL while preserving query state", () => {
    expect(resolveWebUrl("visualworks://marvel-timeline?order=event")).toBe(
      `${PRODUCTION_URL}/marvel-timeline?order=event`
    );
  });

  it("accepts a published web URL unchanged for resumed app links", () => {
    const url = `${PRODUCTION_URL}/character/456?universe=789`;
    expect(resolveWebUrl(url)).toBe(url);
  });

  it("ignores unrelated URLs and empty initial URLs", () => {
    expect(resolveWebUrl(null)).toBeNull();
    expect(resolveWebUrl("https://example.com/other-app")).toBeNull();
  });
});
