import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (conditional + de-duplicated). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Local date key, e.g. "2026-06-23" — used for daily limits & streaks. */
export function todayKey(d: Date = new Date()): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Difference in whole days between two yyyy-mm-dd keys (a - b). */
export function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Promise-based delay used to simulate agent / network latency. */
export function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/** Format a price; 0 => localized "Free" handled by caller. */
export function money(n: number): string {
  return `$${n}`;
}
