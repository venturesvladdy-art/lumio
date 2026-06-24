"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  sections,
  dateLabel,
  showDraft = true,
}: {
  title: string;
  sections: LegalSection[];
  /** Overrides the default "Last updated" line (e.g. an effective date). */
  dateLabel?: string;
  /** Show the "draft / placeholder" banner. Off for finalized documents. */
  showDraft?: boolean;
}) {
  const t = useT();
  return (
    <div className="container-page max-w-3xl py-12 lg:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-ink"
      >
        <Icon name="ChevronLeft" className="h-4 w-4" />
        {t("legal.backHome")}
      </Link>

      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {dateLabel ?? t("legal.lastUpdated")}
      </p>

      {showDraft && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Icon name="Lightbulb" className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{t("legal.draft")}</span>
        </div>
      )}

      <article className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-display text-xl font-semibold text-ink">
              {i + 1}. {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} className="mt-3 text-[15px] leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
