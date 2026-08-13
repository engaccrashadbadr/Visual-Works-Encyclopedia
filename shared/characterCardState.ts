export type CharacterCardState = { id: number; role?: string | null } | null;

export function openCharacterCard(id: number, role?: string | null): CharacterCardState {
  return { id, role: role ?? null };
}

export function closeCharacterCard(): CharacterCardState {
  return null;
}
