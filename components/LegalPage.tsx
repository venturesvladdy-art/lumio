"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";

/** A body block: a paragraph (string), a bullet list, or a highlighted callout. */
export type LegalBlock = string | { bullets: string[] } | { callout: string };

export interface LegalSection {
  heading: string;
  body: LegalBlock[];
}

/** Render inline **bold** spans within a paragraph/bullet/callout. */
function inline(text: string): React.ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-ink">
        {part}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export function LegalPage({
  title,
  sections,
  dateLabel,
  showDraft = true,
  note,
}: {
  title: string;
  sections: LegalSection[];
  /** Overrides the default "Last updated" line (e.g. an effective date). */
  dateLabel?: string;
  /** Show the amber banner. Off for finalized documents. */
  showDraft?: boolean;
  /** Overrides the default banner text (e.g. a counsel-review caveat). */
  note?: string;
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
          <span>{note ?? t("legal.draft")}</span>
        </div>
      )}

      <article className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-display text-xl font-semibold text-ink">
              {i + 1}. {s.heading}
            </h2>
            {s.body.map((block, j) => {
              if (typeof block === "string") {
                return (
                  <p key={j} className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    {inline(block)}
                  </p>
                );
              }
              if ("bullets" in block) {
                return (
                  <ul key={j} className="mt-3 space-y-2 pl-1">
                    {block.bullets.map((b, k) => (
                      <li key={k} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-600">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                        <span>{inline(b)}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <div
                  key={j}
                  className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] leading-relaxed text-slate-700"
                >
                  {inline(block.callout)}
                </div>
              );
            })}
          </section>
        ))}
      </article>
    </div>
  );
}
