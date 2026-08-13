import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import MarvelTimelinePage from "./MarvelTimelinePage";

const { useQuery } = vi.hoisted(() => ({
  useQuery: vi.fn(() => ({ data: [{ id: 1, title: "Captain America", type: "film", releaseYear: 2011, canonLabel: "MCU" }], isLoading: false })),
}));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { marvelTimeline: { useQuery } } } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MarvelTimelinePage sharing", () => {
  it("copies a direct URL for the selected timeline order", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    window.history.replaceState({}, "", "/timeline?order=event");
    render(<LanguageProvider><MarvelTimelinePage /></LanguageProvider>);
    expect(useQuery).toHaveBeenCalledWith({ order: "event" });
    fireEvent.click(screen.getByRole("button", { name: "مشاركة هذا الترتيب" }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("order=event")));
  });
});
