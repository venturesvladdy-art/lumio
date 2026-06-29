import type { PlanTier } from "@/lib/types";

/**
 * Accounts auto-granted the Guru plan on sign-in (demo and DB modes).
 * Empty by default — grant paid tiers through Stripe or a promo code, not a
 * hardcoded list. In production this belongs in your database / admin tooling.
 */
const GURU_EMAILS = new Set<string>();

export function tierForEmail(email: string): PlanTier | null {
  return GURU_EMAILS.has(email.trim().toLowerCase()) ? "guru" : null;
}
