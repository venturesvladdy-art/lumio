import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Pill, SectionLabel } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "About — SkillSprinter",
  description:
    "SkillSprinter is an AI-powered learning platform that turns any skill into a personalized, mastery-based practice plan. Learn what we believe and why we built it.",
};

const VALUES = [
  {
    icon: "Sparkles",
    title: "Personalized by AI",
    desc: "A short intake calibrates your level, then AI builds practice tuned to exactly what you need next — never one-size-fits-all.",
  },
  {
    icon: "Gauge",
    title: "Built around mastery",
    desc: "Progress is measured by concepts you can actually demonstrate, across four levels per subarea — not by hours logged or videos watched.",
  },
  {
    icon: "Gamepad2",
    title: "Designed to be fun",
    desc: "XP, streaks, levels, and badges turn steady practice into momentum, so showing up every day feels rewarding instead of like a chore.",
  },
  {
    icon: "Layers",
    title: "Any skill, one place",
    desc: "From SAT and GMAT prep to communication, engineering, and AI — pick a goal and start practicing in minutes.",
  },
];

const BELIEFS = [
  {
    icon: "Target",
    title: "Practice beats passive consumption",
    desc: "You learn by doing, getting it wrong, and trying again — so SkillSprinter is built on active questions with instant, honest feedback.",
  },
  {
    icon: "TrendingUp",
    title: "Feedback should be immediate",
    desc: "Every answer comes with an explanation and on-demand theory, so a mistake becomes the moment you actually understand something.",
  },
  {
    icon: "Footprints",
    title: "Small steps, compounded",
    desc: "A few focused questions a day, sustained over weeks, outperform cramming. We optimize for the streak, not the all-nighter.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-dotted opacity-[0.5] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        </div>

        <div className="container-page max-w-3xl py-20 text-center lg:py-28">
          <div className="flex justify-center">
            <Pill tone="brand">
              <Icon name="Sparkles" className="h-3.5 w-3.5" />
              About SkillSprinter
            </Pill>
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.07] tracking-tight text-ink sm:text-5xl">
            Learning that <span className="text-gradient">sprints with you</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            SkillSprinter exists to make getting better at something feel fast, focused,
            and genuinely fun. We pair adaptive AI with a mastery-based system so every
            minute you practice moves you measurably closer to your goal.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/skills" size="lg">
              Start learning
              <Icon name="ArrowRight" className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="outline">
              See plans
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ───────────────── Mission ───────────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Our mission</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Make mastering any skill accessible to everyone
            </h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
            <p>
              Most learning tools ask you to sit through content and hope it sticks.
              We started SkillSprinter because real progress comes from a tighter loop:
              practice a concept, find out immediately whether you&apos;ve got it, and let
              the next question adapt to your answer.
            </p>
            <p>
              Our AI maps each skill into a catalogue of areas and subareas, calibrates
              where you&apos;re starting from, and then generates focused drills that target
              exactly the concepts you haven&apos;t mastered yet. As you demonstrate each one,
              you climb from Beginner toward Expert — with the hardest level earned only
              through your own answers, never handed out.
            </p>
            <p>
              The result is a learning experience that feels less like a course and more
              like a coach: always meeting you where you are, always nudging you one
              step further.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────── What makes us different ───────────────── */}
      <section className="container-page py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>What makes us different</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            A smarter way to practice
          </h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
                <Icon name={v.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {v.title}
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-500">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── Stat strip ───────────────── */}
      <section className="border-y border-slate-200 bg-paper">
        <div className="container-page grid grid-cols-3 gap-6 py-10 text-center">
          {[
            { v: "10", k: "Skills to choose from" },
            { v: "6", k: "Question formats" },
            { v: "4", k: "Mastery levels per subarea" },
          ].map((s) => (
            <div key={s.v}>
              <div className="font-display text-2xl font-bold text-ink sm:text-3xl">
                {s.v}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 sm:text-sm">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── What we believe ───────────────── */}
      <section className="container-page py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>What we believe</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            The principles behind the product
          </h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {BELIEFS.map((b) => (
            <div
              key={b.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name={b.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {b.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── Company ───────────────── */}
      <section className="bg-paper py-20 lg:py-24">
        <div className="container-page mx-auto max-w-2xl text-center">
          <SectionLabel>The company</SectionLabel>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Built by Vladdy Ventures
          </h2>
          <p className="mx-auto mt-4 text-[15px] leading-relaxed text-slate-600">
            SkillSprinter is operated by Vladdy Ventures LLC. We&apos;re a small,
            independent team building tools that help people learn faster and enjoy
            the climb. Have a question, an idea, or feedback? We&apos;d genuinely love to
            hear it.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/contact" variant="outline">
              <Icon name="Mail" className="h-4 w-4" />
              Get in touch
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ───────────────── CTA band ───────────────── */}
      <section className="container-page py-20 lg:pb-28">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-600 to-violet-700 px-8 py-16 text-center shadow-lift sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-dotted opacity-20" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start sprinting?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
              Pick a skill, take a quick intake, and get your first personalized drill in
              minutes — free to begin.
            </p>
            <div className="mt-9">
              <ButtonLink
                href="/skills"
                size="lg"
                className="bg-white text-brand-700 hover:bg-brand-50"
              >
                Explore skills
                <Icon name="ArrowRight" className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
