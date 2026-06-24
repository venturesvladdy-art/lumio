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
