import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CharacterCardDialog from "./CharacterCardDialog";

const entity = { id: 12, kind: "character", name: "Peter Parker", nameAr: "بيتر باركر", description: "Hero" };

describe("CharacterCardDialog UI", () => {
  it("renders the selected character card and closes through the UI", () => {
    const onOpenChange = vi.fn();
    render(<LanguageProvider><CharacterCardDialog entity={entity} isOpen onOpenChange={onOpenChange} role="Hero" /></LanguageProvider>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("بيتر باركر")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
