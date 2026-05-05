export type LevelName = "Livsnyter" | "Lokalkjent" | "Soljeger" | "Utelivskonge" | "Legende";

const LEVELS = [
  { min: 0, max: 49, name: "Livsnyter" as const },
  { min: 50, max: 149, name: "Lokalkjent" as const },
  { min: 150, max: 349, name: "Soljeger" as const },
  { min: 350, max: 749, name: "Utelivskonge" as const },
  { min: 750, max: Number.POSITIVE_INFINITY, name: "Legende" as const },
];

export function getLevel(points: number): LevelName {
  return LEVELS.find((l) => points >= l.min && points <= l.max)?.name ?? "Livsnyter";
}

export function getNextLevelThreshold(points: number): number | null {
  const current = LEVELS.find((l) => points >= l.min && points <= l.max);
  if (!current || !Number.isFinite(current.max)) return null;
  return current.max + 1;
}

export function getLevelProgress(points: number): number {
  const current = LEVELS.find((l) => points >= l.min && points <= l.max);
  if (!current || !Number.isFinite(current.max)) return 1;
  return Math.max(0, Math.min(1, (points - current.min) / (current.max - current.min + 1)));
}
