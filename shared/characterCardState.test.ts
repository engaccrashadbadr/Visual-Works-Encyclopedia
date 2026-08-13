import { describe, expect, it } from "vitest";
import { closeCharacterCard, openCharacterCard } from "./characterCardState";

describe("character card interaction state", () => {
  it("opens with the selected character and role", () => {
    expect(openCharacterCard(120, "hero")).toEqual({ id: 120, role: "hero" });
  });

  it("closes from either work or map entry point", () => {
    expect(closeCharacterCard()).toBeNull();
  });
});
