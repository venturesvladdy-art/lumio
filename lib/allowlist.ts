import type { PlanTier } from "@/lib/types";

/**
 * Accounts auto-granted the Guru plan on sign-in (demo and DB modes).
 * In production this belongs in your database / admin tooling.
 */
const GURU_EMAILS = new Set<string>(["vladimir.s.anokhin@gmail.com"]);

export function tierForEmail(email: string): PlanTier | null {
  return GURU_EMAILS.has(email.trim().toLowerCase()) ? "guru" : null;
}
