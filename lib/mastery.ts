import type { MasteryLevel } from "@/lib/types";

/**
 * v2 mastery model: within a subarea a learner climbs four bands —
 * Beginner → Intermediate → Advanced → Expert — and the UI shows "% to next
 * level". The intake survey sets the STARTING band (and credits its floor, so
 * you begin partway up); nobody starts at Expert — the top stretch is earned
 * only by mastering concepts through Q&A.
 *
 * "Mastered" = a distinct CONCEPT answered correctly (concept-deduped, so
 * rephrasings / number-swaps don't pad progress). A subarea's `conceptTarget`
 * (~full coverage, capped) is the denominator; bands are fractions of it.
 */

export const LEVELS: MasteryLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

/** Cumulative fraction of conceptTarget required to ENTER each band. */
export const LEVEL_FLOOR: Record<MasteryLevel, number> = {
  beginner: 0,
  intermediate: 0.2,
  advanced: 0.5,
  expert: 0.8,
};

export const CONCEPT_TARGET_DEFAULT = 200;
export const CONCEPT_TARGET_BAND: readonly [number, number] = [60, 400];

/** A subarea is fully mastered (Expert, 100%) at this fraction of the target. */
const FULL = 1.0;

/** Clamp a model-estimated concept target into the sane band. */
export function clampTarget(target: number | null | undefined): number {
  const t = target ?? CONCEPT_TARGET_DEFAULT;
  return Math.min(CONCEPT_TARGET_BAND[1], Math.max(CONCEPT_TARGET_BAND[0], t));
}

/**
 * Starting band from the survey's proficiency (0..1). Capped at "advanced" —
 * Expert is never a starting level.
 */
export function startLevelFor(proficiency: number): MasteryLevel {
  if (proficiency >= 0.7) return "advanced";
  if (proficiency >= 0.4) return "intermediate";
  return "beginner";
}

/** Concepts credited for free at a starting band (the band's floor). */
export function creditedConceptsFor(
  startLevel: MasteryLevel,
  target: number
): number {
  return Math.round(LEVEL_FLOOR[startLevel] * clampTarget(target));
}

export interface LevelStanding {
  level: MasteryLevel;
  pctToNext: number; // 0..100 (100 only at fully-mastered Expert)
  effectiveMastered: number; // credited + real, capped at target
  target: number;
}

/**
 * Resolve a learner's band + progress-to-next from credited floor + real
 * mastered concepts. `realMastered` is distinct concepts mastered via Q&A.
 */
export function standing(
  realMastered: number,
  startLevel: MasteryLevel,
  target: number
): LevelStanding {
  const t = clampTarget(target);
  const credited = creditedConceptsFor(startLevel, t);
  const effective = Math.min(t, credited + Math.max(0, realMastered));
  const frac = t > 0 ? effective / t : 0;

  let level: MasteryLevel = "beginner";
  for (const L of LEVELS) if (frac >= LEVEL_FLOOR[L]) level = L;

  const idx = LEVELS.indexOf(level);
  const floor = LEVEL_FLOOR[level];
  const ceil = idx < LEVELS.length - 1 ? LEVEL_FLOOR[LEVELS[idx + 1]] : FULL;
  const span = ceil - floor || 1;
  const pctToNext = Math.min(100, Math.max(0, Math.round(((frac - floor) / span) * 100)));

  return { level, pctToNext, effectiveMastered: effective, target: t };
}

/** Overall band from an aggregate 0..1 fraction (for the whole-skill headline). */
export function levelForFraction(frac: number): MasteryLevel {
  let level: MasteryLevel = "beginner";
  for (const L of LEVELS) if (frac >= LEVEL_FLOOR[L]) level = L;
  return level;
}

export const LEVEL_LABEL: Record<MasteryLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};
