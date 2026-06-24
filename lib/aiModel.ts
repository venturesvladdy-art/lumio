import type { PlanTier } from "@/lib/types";

/**
 * Model routing for AI generation. Server-only (reads env).
 *
 *  • Free (basic) plans get the faster, cheaper Sonnet model.
 *  • Paid (smart / guru) plans — and all skill-evaluation question
 *    generation — get Opus, our most capable model.
 *
 * When a learner upgrades, their plans are regenerated with `OPUS_MODEL`
 * (see lib/regenerate.ts), so paid users always have Opus-built curricula.
 */
export const OPUS_MODEL =
  process.env.SKILLSPRINTER_MODEL_OPUS ||
  process.env.LUMIO_MODEL_OPUS ||
  "claude-opus-4-8";
export const SONNET_MODEL =
  process.env.SKILLSPRINTER_MODEL_SONNET ||
  process.env.LUMIO_MODEL_SONNET ||
  "claude-sonnet-4-6";

/** The model used to build a learning plan for the given tier. */
export function modelForTier(tier: PlanTier): string {
  // Allow a single override to force a model everywhere (handy for testing).
  const override = process.env.SKILLSPRINTER_MODEL || process.env.LUMIO_MODEL;
  if (override) return override;
  return tier === "basic" ? SONNET_MODEL : OPUS_MODEL;
}

/** True for paid tiers (Opus-tier generation). */
export function isPaidTier(tier: PlanTier): boolean {
  return tier === "smart" || tier === "guru";
}
