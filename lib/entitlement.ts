import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import type { PlanTier } from "@/lib/types";

/**
 * Server-side entitlement + authoritative grading — the security backbone.
 * Every protected route resolves the signed-in user's tier/verification here and
 * grades answers against the stored key, so the client can never forge XP,
 * correctness, or its tier. (Proposal §2.4 / Phase 1.)
 */

export interface Entitlement {
  userId: string;
  tier: PlanTier;
  verified: boolean;
}

/** Resolve the signed-in user's entitlement from the session (JWT carries tier + verified). */
export async function getEntitlement(): Promise<Entitlement | null> {
  const session = await auth();
  const u = session?.user as
    | { id?: string; tier?: string; emailVerified?: boolean }
    | undefined;
  if (!u?.id) return null;
  return {
    userId: u.id,
    tier: (u.tier as PlanTier) ?? "basic",
    verified: Boolean(u.emailVerified),
  };
}

/** Attempts the user has logged so far in the current UTC day. */
export async function dailyAttemptCount(userId: string): Promise<number> {
  if (!prisma) return 0;
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  return prisma.attempt.count({ where: { userId, answeredAt: { gte: dayStart } } });
}

/** Per-day question limit for a tier (Infinity = unlimited / fair-use). */
export function dailyLimitFor(tier: PlanTier): number {
  return PLANS[tier].dailyQuestions;
}

export interface AnswerSubmission {
  selectedIndex?: number;
  responseText?: string;
  score?: number;
}

export interface AnswerKey {
  type: string;
  correctIndex: number;
  answerText: string | null;
  acceptedAnswers: string[];
  correctOrder: number[];
}

function parseNum(s: string | null | undefined): number | null {
  if (s == null) return null;
  const n = Number(String(s).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Authoritatively grade a submitted answer against the stored key — never trust
 * the client's `correct` flag. Free-text relies on the AI grade score relayed
 * from /api/grade (clamped to a pass threshold); every other type is exact.
 */
export function gradeAnswer(key: AnswerKey, sub: AnswerSubmission): boolean {
  switch (key.type) {
    case "mcq":
    case "truefalse":
      return typeof sub.selectedIndex === "number" && sub.selectedIndex === key.correctIndex;
    case "numeric": {
      const a = parseNum(sub.responseText);
      const b = parseNum(key.answerText);
      return a !== null && b !== null && a === b;
    }
    case "input": {
      const norm = (sub.responseText ?? "").trim().toLowerCase();
      return key.acceptedAnswers.some((x) => x === norm);
    }
    case "order": {
      try {
        const arr = JSON.parse(sub.responseText ?? "[]") as unknown[];
        return (
          Array.isArray(arr) &&
          key.correctOrder.length > 0 &&
          arr.length === key.correctOrder.length &&
          arr.every((v, i) => v === key.correctOrder[i])
        );
      } catch {
        return false;
      }
    }
    case "free":
      // AI-graded upstream; trust only a server-shaped numeric score, pass at ≥3/5.
      return typeof sub.score === "number" && sub.score >= 3;
    default:
      return false;
  }
}
