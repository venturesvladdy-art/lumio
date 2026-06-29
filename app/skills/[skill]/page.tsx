import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SKILLS, getSkill } from "@/lib/skills";
import { getTasteBank } from "@/lib/taste/banks";

const BASE = "https://skillsprinter.com";

export function generateStaticParams() {
  return SKILLS.filter((s) => s.predefined).map((s) => ({ skill: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skill: string }>;
}): Promise<Metadata> {
  const { skill: id } = await params;
  const skill = getSkill(id);
  if (!skill) return {};
  const name = skill.name.en;
  const topics = skill.topics.en.slice(0, 3).join(", ");
  const description = `Practice ${name} with AI-personalized questions that adapt as you learn — ${topics} and more. Free to start, no credit card. Earn XP and build a daily streak.`;
  return {
    title: `${name} Practice — Free Adaptive Questions`,
    description,
    alternates: { canonical: `/skills/${id}` },
    openGraph: {
      type: "website",
      title: `${name} Practice | SkillSprinter`,
      description,
      url: `/skills/${id}`,
    },
  };
}

export default async function SkillLandingPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const { skill: id } = await params;
  const skill = getSkill(id);
  if (!skill || !skill.predefined) notFound();

  const name = skill.name.en;
  const topics = skill.topics.en;
  const hasTaste = Boolean(getTasteBank(id));
  const ctaHref = hasTaste ? `/try/${id}` : `/learn/${id}`;
  const ctaLabel = hasTaste ? `Try ${name} free` : `Start ${name} free`;
  const related = SKILLS.filter((s) => s.predefined && s.id !== id).slice(0, 5);

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
        description: skill.description.en,
        url: `${BASE}/skills/${id}`,
        provider: { "@type": "Organization", name: "SkillSprinter", url: BASE },
        offers: { "@type": "Offer", category: "Free", price: "0", priceCurrency: "USD" },
        about: topics,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Skills", item: `${BASE}/skills` },
          { "@type": "ListItem", position: 2, name, item: `${BASE}/skills/${id}` },
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
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Adaptive practice
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {name}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{skill.tagline.en}</p>
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
        <p className="mt-3 text-slate-600">{skill.description.en}</p>
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

      {/* Related skills (internal links) */}
      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          More skills to explore
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {related.map((s) => (
            <Link
              key={s.id}
              href={`/skills/${s.id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              {s.name.en}
            </Link>
          ))}
          <Link
            href="/skills"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-brand-600 hover:underline"
          >
            All skills →
          </Link>
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
