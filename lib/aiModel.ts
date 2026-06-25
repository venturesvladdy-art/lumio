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
export const HAIKU_MODEL =
  process.env.SKILLSPRINTER_MODEL_HAIKU || "claude-haiku-4-5-20251001";

/**
 * v2 model routing.
 * - Taxonomy breakdown: strongest model (once per skill, cached, off hot path).
 * - Real-time theory: Haiku by default (fast/cheap), escalating to Sonnet for
 *   hard cases (advanced free-response, multi-step worked math).
 */
export const TAXONOMY_MODEL = process.env.SKILLSPRINTER_MODEL_TAXONOMY || OPUS_MODEL;
export const THEORY_MODEL = process.env.SKILLSPRINTER_THEORY_MODEL || HAIKU_MODEL;
export const THEORY_ESCALATION_MODEL =
  process.env.SKILLSPRINTER_THEORY_MODEL_HARD || SONNET_MODEL;

/** The model used to build a learning plan for the given tier. */
export function modelForTier(tier: PlanTier): string {
  // Allow a single override to force a model everywhere (handy for testing).
  const override = process.env.SKILLSPRINTER_MODEL || process.env.LUMIO_MODEL;
  if (override) return override;
  return tier === "basic" ? SONNET_MODEL : OPUS_MODEL;
}

/** Generation reasoning effort by tier (Opus/Sonnet support output_config.effort). */
export function effortForTier(tier: PlanTier): "low" | "medium" {
  return tier === "basic" ? "low" : "medium";
}

/** True for paid tiers (Opus-tier generation). */
export function isPaidTier(tier: PlanTier): boolean {
  return tier === "smart" || tier === "guru";
}
