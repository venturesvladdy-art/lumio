import Stripe from "stripe";
import type { PlanTier } from "@/lib/types";

/** Guarded Stripe singleton — null when STRIPE_SECRET_KEY is unset. */
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export type Interval = "month" | "year";

/** Stripe Price IDs for each paid tier/interval (from env). */
export const PRICE_IDS = {
  smart: {
    month: process.env.STRIPE_PRICE_SMART_MONTH,
    year: process.env.STRIPE_PRICE_SMART_YEAR,
  },
  guru: {
    month: process.env.STRIPE_PRICE_GURU_MONTH,
    year: process.env.STRIPE_PRICE_GURU_YEAR,
  },
} as const;

export function priceIdFor(
  tier: PlanTier,
  interval: Interval
): string | undefined {
  if (tier === "smart") return interval === "month" ? PRICE_IDS.smart.month : PRICE_IDS.smart.year;
  if (tier === "guru") return interval === "month" ? PRICE_IDS.guru.month : PRICE_IDS.guru.year;
  return undefined;
}

/** Reverse-map a Stripe price id back to a plan tier. */
export function tierForPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  if (priceId === PRICE_IDS.smart.month || priceId === PRICE_IDS.smart.year) return "smart";
  if (priceId === PRICE_IDS.guru.month || priceId === PRICE_IDS.guru.year) return "guru";
  return null;
}

/** Ordinal rank of a tier — drives upgrade (higher) vs downgrade (lower) logic. */
export function tierRank(tier: PlanTier): number {
  return tier === "guru" ? 2 : tier === "smart" ? 1 : 0;
}

/** Which interval a configured price id belongs to (so we can keep it on change). */
export function intervalForPriceId(priceId: string | null | undefined): Interval | null {
  if (!priceId) return null;
  if (priceId === PRICE_IDS.smart.month || priceId === PRICE_IDS.guru.month) return "month";
  if (priceId === PRICE_IDS.smart.year || priceId === PRICE_IDS.guru.year) return "year";
  return null;
}
