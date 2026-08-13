import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => cleanup());
import { LanguageProvider } from "@/contexts/LanguageContext";
import CharacterCardDialog from "./CharacterCardDialog";

const entity = { id: 12, kind: "character", name: "Peter Parker", nameAr: "بيتر باركر", description: "Hero" };

describe("CharacterCardDialog UI", () => {
  it("copies a direct character-card URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<LanguageProvider><CharacterCardDialog entity={entity} isOpen onOpenChange={vi.fn()} role="Hero" /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "مشاركة" }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("character=12")));
  });

  it("renders the selected character card and closes through the UI", () => {
    const onOpenChange = vi.fn();
    render(<LanguageProvider><CharacterCardDialog entity={entity} isOpen onOpenChange={onOpenChange} role="Hero" /></LanguageProvider>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("بيتر باركر")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
