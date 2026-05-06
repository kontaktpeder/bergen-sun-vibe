export type LevelName = "Nyter" | "Lokalkjent" | "Soljeger" | "Utelivsekspert" | "Legende";

const LEVELS = [
  { min: 0, max: 99, name: "Nyter" as const },
  { min: 100, max: 299, name: "Lokalkjent" as const },
  { min: 300, max: 749, name: "Soljeger" as const },
  { min: 750, max: 1499, name: "Utelivsekspert" as const },
  { min: 1500, max: Number.POSITIVE_INFINITY, name: "Legende" as const },
];

export function getLevel(points: number): LevelName {
  return LEVELS.find((l) => points >= l.min && points <= l.max)?.name ?? "Nyter";
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
