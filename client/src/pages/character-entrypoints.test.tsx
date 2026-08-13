import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";

const mocks = vi.hoisted(() => ({
  workQuery: vi.fn(),
  graphQuery: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: { catalog: { work: { useQuery: mocks.workQuery }, graph: { useQuery: mocks.graphQuery } } },
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
  useRoute: () => [true, { id: "120001" }],
  useLocation: () => ["/", vi.fn()],
}));

import WorkPage from "./WorkPage";
import UniverseMapPage from "./UniverseMapPage";

const character = { id: 901, kind: "character", name: "Peter Parker", nameAr: "بيتر باركر", description: "Hero", imageUrl: null, abilities: null, relationships: null };

describe("character card entry points", () => {
  it("opens and closes from a work cast card", () => {
    mocks.workQuery.mockReturnValue({ isLoading: false, data: { work: { id: 120001, title: "Marvel Work", titleAr: null, type: "film", summary: "Summary", coverImageUrl: null, bannerImageUrl: null, releaseYear: 2025, score: null, episodeCount: null, durationMinutes: null, canonLabel: null, studio: null, director: null, ageRating: null, universeId: 60001 }, entities: [{ entity: character, role: "Hero", isMain: true }], relations: [] } });
    render(<LanguageProvider><WorkPage /></LanguageProvider>);
    fireEvent.click(screen.getByText("Peter Parker"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens and closes from a map character node", () => {
    mocks.graphQuery.mockReturnValue({ isLoading: false, isError: false, data: { selectedUniverseId: 60001, universes: [{ id: 60001, name: "Marvel", nameAr: "مارفل" }], nodes: [{ id: "universe:60001", kind: "universe", label: "Marvel", labelAr: "مارفل" }, { id: "character:901", refId: 901, kind: "character", label: "Peter Parker", labelAr: "بيتر باركر", description: "Hero" }], edges: [{ id: "e1", source: "universe:60001", target: "character:901", type: "appearance", label: "Appearance" }] } });
    render(<LanguageProvider><UniverseMapPage /></LanguageProvider>);
    fireEvent.click(screen.getByText("بيتر باركر"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
