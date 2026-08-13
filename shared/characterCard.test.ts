import { describe, expect, it } from "vitest";
import { toCharacterCardEntity } from "./characterCard";

describe("character card entry points", () => {
  it("normalizes a work character entity for the shared dialog", () => {
    expect(toCharacterCardEntity({ id: 7, name: "Peter Parker", kind: "character", description: "Hero" })).toMatchObject({ id: 7, kind: "character", name: "Peter Parker", description: "Hero" });
  });

  it("normalizes a map character node with optional fields", () => {
    expect(toCharacterCardEntity({ id: 8, name: "Wanda", kind: "character", nameAr: "واندا", imageUrl: null })).toMatchObject({ id: 8, nameAr: "واندا", imageUrl: null });
  });
});
