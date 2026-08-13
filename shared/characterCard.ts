export type CharacterCardInput = {
  id: number;
  kind?: string | null;
  name: string;
  nameAr?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  abilities?: string | null;
  relationships?: string | null;
};

export function toCharacterCardEntity(input: CharacterCardInput) {
  return {
    id: input.id,
    kind: input.kind || "character",
    name: input.name,
    nameAr: input.nameAr ?? null,
    imageUrl: input.imageUrl ?? null,
    description: input.description ?? null,
    descriptionAr: input.descriptionAr ?? null,
    abilities: input.abilities ?? null,
    relationships: input.relationships ?? null,
  };
}
