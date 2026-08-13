export type TimelineOrder = "story" | "release" | "event";

export function buildTimelineShareUrl(origin: string, order: TimelineOrder): string {
  const url = new URL("/timeline", origin);
  url.searchParams.set("order", order);
  return url.toString();
}

export function buildCharacterShareUrl(origin: string, path: string, characterId: number, universeId?: number): string {
  const url = new URL(path, origin);
  if (universeId) url.searchParams.set("universe", String(universeId));
  url.searchParams.set("character", String(characterId));
  return url.toString();
}

export function readTimelineOrder(search: string): TimelineOrder {
  const value = new URLSearchParams(search).get("order");
  return value === "release" || value === "event" ? value : "story";
}

export function readUniverseId(search: string): number | null {
  const value = Number(new URLSearchParams(search).get("universe"));
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function readCharacterId(search: string): number | null {
  const value = Number(new URLSearchParams(search).get("character"));
  return Number.isInteger(value) && value > 0 ? value : null;
}
