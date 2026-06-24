import type { AccentColor } from "@/lib/types";

/** Soft tinted tile (icon background) per accent. */
export const ACCENT_TILE: Record<AccentColor, string> = {
  brand: "bg-brand-50 text-brand-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
};

/** Vivid gradient per accent (for filled marks / hero accents). */
export const ACCENT_GRADIENT: Record<AccentColor, string> = {
  brand: "from-brand-500 to-violet-600",
  amber: "from-amber-400 to-orange-500",
  emerald: "from-emerald-400 to-teal-500",
  sky: "from-sky-400 to-blue-500",
  rose: "from-rose-400 to-pink-500",
  violet: "from-violet-500 to-purple-600",
};
