import type { Metadata } from "next";
import Link from "next/link";
import { resolveSkill } from "@/lib/skills";
import { TASTE_SKILL_IDS } from "@/lib/taste/banks";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { Pill, SectionLabel } from "@/components/ui/primitives";
import { ACCENT_TILE } from "@/components/ui/accent";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Try free — SkillSprinter",
  description:
    "Sample SkillSprinter with no signup. Pick a skill, answer 5 questions, and peek at the theory behind each one.",
};

export default function TryPage() {
  const skills = TASTE_SKILL_IDS.map((id) => resolveSkill(id));

  return (
    <div className="container-page py-14 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center">
          <Pill tone="emerald">
            <Icon name="Sparkles" className="h-3.5 w-3.5" />
            No signup needed
          </Pill>
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Take a free taste
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Pick a skill, answer 5 sample questions, and reveal the background theory behind each —
          all without creating an account.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <Link
            key={skill.id}
            href={`/try/${skill.id}`}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift focusable"
          >
            <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", ACCENT_TILE[skill.accent])}>
              <Icon name={skill.icon} className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-ink">{skill.name.en}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{skill.tagline.en}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Try it free
              <Icon name="ArrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-xl rounded-3xl border border-brand-100 bg-brand-50/50 p-7 text-center">
        <h2 className="font-display text-xl font-semibold text-ink">Ready for the full thing?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          A free account unlocks AI-personalized plans that adapt to you, real-time explanations,
          mastery tracking, XP and streaks.
        </p>
        <div className="mt-5 flex justify-center">
          <ButtonLink href="/login?mode=signup">
            Create a free account
            <Icon name="ArrowRight" className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
