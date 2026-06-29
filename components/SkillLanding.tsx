import Link from "next/link";

const BASE = "https://skillsprinter.com";

export interface SkillLandingProps {
  /** Path segment under /skills, e.g. "python" or "sat-prep" (for canonical/schema). */
  slug: string;
  name: string;
  tagline: string;
  description: string;
  topics: string[];
  ctaHref: string;
  ctaLabel: string;
  related: { name: string; href: string }[];
  eyebrow?: string;
}

/** Shared marketing landing layout for a skill / exam, with Course + Breadcrumb JSON-LD. */
export function SkillLanding({
  slug,
  name,
  tagline,
  description,
  topics,
  ctaHref,
  ctaLabel,
  related,
  eyebrow = "Adaptive practice",
}: SkillLandingProps) {
  const steps: [string, string][] = [
    ["Tell us your level", `A few quick questions calibrate ${name} practice to exactly where you are — beginner to advanced.`],
    ["Get an adaptive plan", `Our AI builds a personalized set of questions across ${topics.slice(0, 3).join(", ")} and more.`],
    ["Practice and level up", "Answer one question at a time, get instant feedback, earn XP, and keep a daily streak alive."],
  ];
  const why: [string, string][] = [
    ["Truly adaptive", `Every question adjusts to your ${name} level, so you're never bored or lost.`],
    ["Bite-sized", "One question at a time fits into any spare five minutes."],
    ["Gamified", "XP, levels, streaks and badges keep you coming back."],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: `${name} — adaptive practice`,
        description,
        url: `${BASE}/skills/${slug}`,
        provider: { "@type": "Organization", name: "SkillSprinter", url: BASE },
        offers: { "@type": "Offer", category: "Free", price: "0", priceCurrency: "USD" },
        about: topics,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Skills", item: `${BASE}/skills` },
          { "@type": "ListItem", position: 2, name, item: `${BASE}/skills/${slug}` },
        ],
      },
    ],
  };

  return (
    <div className="container-page py-14 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/skills" className="hover:text-brand-600">
          Skills
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">{name}</span>
      </nav>

      {/* Hero */}
      <div className="mx-auto mt-6 max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {name}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{tagline}</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-brand-600 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            {ctaLabel}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-7 py-3 font-semibold text-ink transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            See plans
          </Link>
        </div>
        <p className="mt-3 text-sm text-slate-400">No credit card needed · free plan forever</p>
      </div>

      {/* What you'll practice */}
      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          What you&apos;ll practice
        </h2>
        <p className="mt-3 text-slate-600">{description}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {topics.map((tp) => (
            <li
              key={tp}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink shadow-soft"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                ✓
              </span>
              {tp}
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          How SkillSprinter teaches {name}
        </h2>
        <ol className="mt-6 space-y-4">
          {steps.map(([h, b], i) => (
            <li key={h} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-ink">{h}</h3>
                <p className="mt-1 text-sm text-slate-600">{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Why it works */}
      <section className="mx-auto mt-16 max-w-3xl rounded-3xl border border-slate-200 bg-gradient-to-br from-paper to-white p-8">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Why it works</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {why.map(([h, b]) => (
            <li key={h}>
              <h3 className="font-semibold text-ink">{h}</h3>
              <p className="mt-1 text-sm text-slate-600">{b}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Related (internal links) */}
      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          More to explore
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {related.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              {r.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto mt-16 max-w-3xl rounded-3xl bg-ink p-10 text-center text-white">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Start practicing {name} today
        </h2>
        <p className="mt-3 text-slate-300">
          Free to start. No credit card. See your first results in minutes.
        </p>
        <div className="mt-6">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 font-semibold text-ink transition-transform hover:scale-[1.02]"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
