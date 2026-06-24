import React from "react";
import { cn } from "@/lib/utils";

/** Surface card. */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const PILL_TONES = {
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  sky: "bg-sky-50 text-sky-700 border-sky-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function Pill({
  tone = "slate",
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        PILL_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Horizontal progress bar. value is 0..100. */
export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-slate-100",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-brand-500 transition-all duration-700 ease-out",
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Circular progress ring with centered content. */
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  className,
  trackClassName = "text-slate-100",
  barClassName = "text-brand-500",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  children?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700 ease-out", barClassName)}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** Eyebrow / section label. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.18em] text-brand-600",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Compact stat block. */
export function Stat({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="font-display text-2xl font-semibold text-ink">
        {value}
      </span>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
