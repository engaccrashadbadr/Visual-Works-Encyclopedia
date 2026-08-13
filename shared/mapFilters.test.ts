import { describe, expect, it } from "vitest";
import { filterMapGraph, toggleMapFilter } from "./mapFilters";

describe("map filters", () => {
  const kinds = ["universe", "work", "character"];
  const relations = ["universe_work", "appearance", "family"];

  it("disables a kind on the first click from all-visible state", () => {
    expect(toggleMapFilter("work", [], kinds)).toEqual(["universe", "character"]);
    expect(toggleMapFilter("family", [], relations)).toEqual(["universe_work", "appearance"]);
  });

  it("returns all-visible sentinel after re-enabling every option", () => {
    expect(toggleMapFilter("work", ["work"], ["work", "character"])).toEqual([]);
    expect(toggleMapFilter("character", ["universe", "work"], kinds)).toEqual([]);
    expect(toggleMapFilter("family", ["universe_work", "appearance"], relations)).toEqual([]);
  });

  it("filters nodes, edges, and supports an empty filtered state", () => {
    const nodes = [
      { id: "u-1", kind: "universe", label: "World" },
      { id: "w-1", kind: "work", label: "Film" },
      { id: "c-1", kind: "character", label: "Hero" },
    ];
    const edges = [
      { id: "e-1", source: "u-1", target: "w-1", type: "universe_work" },
      { id: "e-2", source: "w-1", target: "c-1", type: "appearance" },
    ];
    expect(filterMapGraph(nodes, edges, ["character"], ["appearance"]).visibleNodes).toHaveLength(1);
    expect(filterMapGraph(nodes, edges, ["character"], ["appearance"]).visibleEdges).toHaveLength(0);
    expect(filterMapGraph(nodes, edges, ["work"], ["universe_work"], "missing")).toEqual({ visibleNodes: [], visibleEdges: [] });
  });
});
