import { prisma } from "@/lib/db";
import type { PlanTier } from "@/lib/types";

/**
 * Per-user AI budget ledger (Proposal §2.3 / Phase 4). Makes "AI cost ≤ 20% of
 * revenue" a hard invariant: every live model call is priced and recorded, and
 * routes check `remainingBudget` before generating — once spent, they fall back
 * to the bank. Degrades safely (treats spend as $0) until the AiUsage table
 * exists, so nothing breaks before the migration runs.
 */

/** Monthly live-AI budget per tier (= 20% of revenue; Basic is a promo taste). */
export const MONTHLY_BUDGET_USD: Record<PlanTier, number> = {
  basic: 0.15,
  smart: 2.0,
  guru: 8.0,
};

interface Price {
  in: number; // $ / 1M input tokens
  out: number; // $ / 1M output tokens
  cacheRead: number; // $ / 1M cached input tokens (~0.1×)
}

const PRICES: Record<string, Price> = {
  "claude-opus-4-8": { in: 5, out: 25, cacheRead: 0.5 },
  "claude-sonnet-4-6": { in: 3, out: 15, cacheRead: 0.3 },
  "claude-haiku-4-5": { in: 1, out: 5, cacheRead: 0.1 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5, cacheRead: 0.1 },
};

export function priceFor(model: string): Price {
  return PRICES[model] ?? PRICES["claude-sonnet-4-6"];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
}

/** Dollar cost of one call from its token usage (cached input billed at ~0.1×). */
export function costFor(model: string, u: TokenUsage): number {
  const p = priceFor(model);
  const cached = Math.max(0, u.cachedInputTokens ?? 0);
  const freshIn = Math.max(0, u.inputTokens - cached);
  return (freshIn * p.in + cached * p.cacheRead + u.outputTokens * p.out) / 1_000_000;
}

/** Coarse per-operation cost estimate to decide live-vs-bank BEFORE spending. */
export const EST_COST: Record<string, number> = {
  plan: 0.08,
  theory: 0.003,
  grade: 0.0011,
};

/** Current UTC month key, e.g. "2026-06". */
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Append one priced row to the ledger (best-effort; never blocks the request). */
export async function recordUsage(
  userId: string | null,
  kind: string,
  model: string,
  u: TokenUsage
): Promise<void> {
  if (!prisma) return;
  try {
    await prisma.aiUsage.create({
      data: {
        userId,
        kind,
        model,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        cachedInputTokens: u.cachedInputTokens ?? 0,
        costUsd: costFor(model, u),
        period: currentPeriod(),
      },
    });
  } catch {
    /* AiUsage table may not exist yet (pre-migration) — ignore. */
  }
}

/** Budget remaining for the user this month (budget − spend). Safe pre-migration. */
export async function remainingBudget(userId: string, tier: PlanTier): Promise<number> {
  const budget = MONTHLY_BUDGET_USD[tier] ?? 0;
  if (!prisma) return budget;
  try {
    const agg = await prisma.aiUsage.aggregate({
      where: { userId, period: currentPeriod() },
      _sum: { costUsd: true },
    });
    return Math.max(0, budget - (agg._sum.costUsd ?? 0));
  } catch {
    return budget;
  }
}

/** Normalize an Anthropic `response.usage` block into our TokenUsage shape. */
export function usageFromResponse(usage: unknown): TokenUsage {
  const u = (usage ?? {}) as {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
  };
  return {
    inputTokens: u.input_tokens ?? 0,
    outputTokens: u.output_tokens ?? 0,
    cachedInputTokens: u.cache_read_input_tokens ?? 0,
  };
}
