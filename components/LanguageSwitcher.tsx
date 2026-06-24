"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/types";

const LOCALES: Locale[] = ["en", "pl"];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors focusable",
            locale === l
              ? "bg-ink text-white"
              : "text-slate-500 hover:text-ink"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
