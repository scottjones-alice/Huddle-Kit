const NON_SLUG_CHARACTERS = /[^a-z0-9]+/gu;
const EDGE_HYPHENS = /^-+|-+$/gu;

// "Riverside F.C." becomes "riverside-f-c".
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(NON_SLUG_CHARACTERS, "-")
    .replaceAll(EDGE_HYPHENS, "");
}
