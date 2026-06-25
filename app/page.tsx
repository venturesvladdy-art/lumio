"use client";

import Link from "next/link";
import { useT, useTx } from "@/lib/i18n";
import { SKILLS } from "@/lib/skills";
import { SkillCard } from "@/components/SkillCard";
import { PlanCards } from "@/components/PlanCards";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  Pill,
  ProgressBar,
  ProgressRing,
  SectionLabel,
} from "@/components/ui/primitives";

export default function HomePage() {
  const t = useT();
  const tx = useTx();

  const steps = [
    { icon: "Layers", title: t("home.how1Title"), desc: t("home.how1Desc") },
    { icon: "MessageSquare", title: t("home.how2Title"), desc: t("home.how2Desc") },
    { icon: "Sparkles", title: t("home.how3Title"), desc: t("home.how3Desc") },
    { icon: "Trophy", title: t("home.how4Title"), desc: t("home.how4Desc") },
  ];

  const features = [
    { icon: "Gauge", title: t("home.feat1Title"), desc: t("home.feat1Desc") },
    { icon: "Gamepad2", title: t("home.feat2Title"), desc: t("home.feat2Desc") },
    { icon: "Layers", title: t("home.feat3Title"), desc: t("home.feat3Desc") },
  ];

  const gamifyPoints = [
    { icon: "Zap", text: t("home.gamifyXp") },
    { icon: "Flame", text: t("home.gamifyStreak") },
    { icon: "Award", text: t("home.gamifyBadges") },
    { icon: "TrendingUp", text: t("home.gamifyLevels") },
  ];

  return (
    <>
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-dotted opacity-[0.5] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        </div>

        <div className="container-page grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-up">
            <Pill tone="brand">
              <Icon name="Sparkles" className="h-3.5 w-3.5" />
              {t("home.heroBadge")}
            </Pill>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {t("home.heroTitleA")}
              <br />
              <span className="text-gradient">{t("home.heroTitleB")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/try" size="lg">
                Try it free — no signup
                <Icon name="ArrowRight" className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/skills" size="lg" variant="outline">
                {t("home.heroCtaPrimary")}
              </ButtonLink>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <Icon name="CheckCircle2" className="h-4 w-4 text-emerald-500" />
              {t("home.heroNote")}
            </p>
          </div>

          {/* Product preview */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <HeroPreview />
          </div>
        </div>

        {/* Stat strip */}
        <div className="border-y border-slate-200/70 bg-white/60 backdrop-blur">
          <div className="container-page grid grid-cols-3 gap-6 py-6 text-center">
            {[
              { v: "10,000+", k: t("home.trustedBy") },
              { v: "15+", k: "Skills practiced today" },
              { v: "70,000+", k: "Questions answered daily" },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-display text-2xl font-bold text-ink">
                  {s.v}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── How it works ───────────────── */}
      <section id="how" className="container-page scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>{t("nav.howItWorks")}</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("home.howTitle")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{t("home.howSubtitle")}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
            >
              <span className="font-display text-sm font-bold text-brand-300">
                0{i + 1}
              </span>
              <div className="mt-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name={s.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── Features ───────────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>{t("common.appName")}</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t("home.featuresTitle")}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {t("home.featuresSubtitle")}
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
                  <Icon name={f.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Gamification ───────────────── */}
      <section className="container-page py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionLabel>{t("home.gamifyTitle")}</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t("home.gamifyTitle")}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {t("home.gamifySubtitle")}
            </p>
            <ul className="mt-8 space-y-4">
              {gamifyPoints.map((p) => (
                <li key={p.text} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                    <Icon name={p.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[15px] font-medium text-slate-700">
                    {p.text}
                  </span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/skills" className="mt-9">
              {t("common.startLearning")}
              <Icon name="ArrowRight" className="h-4 w-4" />
            </ButtonLink>
          </div>

          <GamifyVisual />
        </div>
      </section>

      {/* ───────────────── Skills ───────────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <SectionLabel>{t("nav.skills")}</SectionLabel>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {t("home.skillsTitle")}
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                {t("home.skillsSubtitle")}
              </p>
            </div>
            <ButtonLink href="/skills" variant="outline">
              {t("home.skillsCta")}
              <Icon name="ArrowRight" className="h-4 w-4" />
            </ButtonLink>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SKILLS.slice(0, 3).map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
            {SKILLS.slice(3).map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
            <Link
              href="/skills"
              className="group flex flex-col items-start justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-left transition-all hover:border-brand-300 hover:bg-brand-50/40 focusable"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Icon name="Plus" className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {t("skills.customTitle")}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                {t("skills.customDesc")}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── Pricing teaser ───────────────── */}
      <section className="container-page py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>{t("nav.pricing")}</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("home.pricingTitle")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("home.pricingSubtitle")}
          </p>
        </div>
        <div className="mt-14">
          <PlanCards billing="monthly" />
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/pricing" variant="ghost">
            {t("home.pricingCta")}
            <Icon name="ArrowRight" className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      {/* ───────────────── CTA band ───────────────── */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-600 to-violet-700 px-8 py-16 text-center shadow-lift sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-dotted opacity-20" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("home.ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
              {t("home.ctaSubtitle")}
            </p>
            <div className="mt-9">
              <ButtonLink
                href="/skills"
                size="lg"
                className="bg-white text-brand-700 hover:bg-brand-50"
              >
                {t("home.ctaButton")}
                <Icon name="ArrowRight" className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ───────────────── Hero product preview ───────────────── */
function HeroPreview() {
  const t = useT();
  const tx = useTx();
  const sample = {
    q: {
      en: "Which sentence is punctuated correctly?",
      pl: "Które zdanie jest poprawne interpunkcyjnie?",
    },
    options: {
      en: ["We packed bags snacks and maps.", "We packed bags, snacks, and maps."],
      pl: ["We packed bags snacks and maps.", "We packed bags, snacks, and maps."],
    },
  };
  const opts = tx(sample.options);

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* floating XP chip */}
      <div className="absolute -right-3 -top-4 z-10 rotate-3 animate-float">
        <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950 shadow-lift">
          <Icon name="Zap" className="h-4 w-4" />
          +25 XP
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <Pill tone="brand">
            <Icon name="GraduationCap" className="h-3.5 w-3.5" />
            SAT Prep
          </Pill>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
            <Icon name="Flame" className="h-4 w-4" />5
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t("session.questionOf", { n: 3, total: 12 })}</span>
            <span>25%</span>
          </div>
          <ProgressBar value={25} className="mt-2" />
        </div>

        <p className="mt-5 font-display text-lg font-semibold leading-snug text-ink">
          {tx(sample.q)}
        </p>

        <div className="mt-4 space-y-2.5">
          <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            {opts[0]}
          </div>
          <div className="flex items-center justify-between rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {opts[1]}
            <Icon name="CheckCircle2" className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Gamification visual ───────────────── */
function GamifyVisual() {
  const t = useT();
  const badges = [
    { icon: "Footprints", tone: "bg-brand-50 text-brand-600" },
    { icon: "Flame", tone: "bg-amber-50 text-amber-600" },
    { icon: "Target", tone: "bg-rose-50 text-rose-600" },
    { icon: "Star", tone: "bg-violet-50 text-violet-600" },
  ];
  return (
    <div className="relative">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex items-center gap-6">
          <ProgressRing value={68} size={120} stroke={12}>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-ink">4</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                {t("dashboard.levelLabel")}
              </div>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <div className="font-display text-lg font-semibold text-ink">
              360 XP
            </div>
            <p className="text-sm text-slate-500">{t("dashboard.toNext", { n: 200 })}</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              <Icon name="Flame" className="h-4 w-4" />7 {t("dashboard.streakUnit")}
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-slate-100 pt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("dashboard.badgesTitle")}
          </div>
          <div className="mt-3 flex gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className={`grid h-12 w-12 place-items-center rounded-2xl ${b.tone}`}
              >
                <Icon name={b.icon} className="h-6 w-6" />
              </div>
            ))}
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-slate-200 text-slate-300">
              <Icon name="Plus" className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
