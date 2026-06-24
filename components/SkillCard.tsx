"use client";

import Link from "next/link";
import type { SkillDef } from "@/lib/types";
import { useT, useTx } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/primitives";
import { ACCENT_TILE } from "@/components/ui/accent";
import { cn } from "@/lib/utils";

export function SkillCard({
  skill,
  href,
  className,
}: {
  skill: SkillDef;
  href?: string;
  className?: string;
}) {
  const t = useT();
  const tx = useTx();
  const link = href ?? `/learn/${skill.id}`;
  const topics = tx(skill.topics).slice(0, 3);

  return (
    <Link
      href={link}
      className={cn(
        "group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift focusable",
        className
      )}
    >
      <div
        className={cn(
          "grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
          ACCENT_TILE[skill.accent]
        )}
      >
        <Icon name={skill.icon} className="h-6 w-6" />
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-ink">
        {tx(skill.name)}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">
        {tx(skill.tagline)}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {topics.map((tp) => (
          <Pill key={tp} tone={skill.accent}>
            {tp}
          </Pill>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand-600">
        {t("skills.start")}
        <Icon
          name="ArrowRight"
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
