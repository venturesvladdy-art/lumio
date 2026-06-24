"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { SKILLS, slugify } from "@/lib/skills";
import { SkillCard } from "@/components/SkillCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionLabel } from "@/components/ui/primitives";

export default function SkillsPage() {
  const t = useT();
  const router = useRouter();
  const [custom, setCustom] = useState("");

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = custom.trim();
    if (!name) return;
    const slug = slugify(name) || "custom-skill";
    router.push(`/learn/${slug}?name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="container-page py-14 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <SectionLabel>{t("nav.skills")}</SectionLabel>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {t("skills.title")}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{t("skills.subtitle")}</p>
      </div>

      <div className="mt-14">
        <h2 className="font-display text-lg font-semibold text-ink">
          {t("skills.popularTitle")}
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </div>

      {/* Custom skill */}
      <div className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-paper to-white p-8 shadow-soft sm:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icon name="Sparkles" className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">
              {t("skills.customTitle")}
            </h2>
            <p className="mt-2 max-w-md text-slate-600">
              {t("skills.customDesc")}
            </p>
          </div>

          <form onSubmit={submitCustom} className="w-full">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={t("skills.customPlaceholder")}
                aria-label={t("skills.customTitle")}
                className="h-12 w-full flex-1 rounded-full border border-slate-300 bg-white px-5 text-[15px] text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring"
              />
              <Button type="submit" size="lg" disabled={!custom.trim()}>
                {t("skills.customButton")}
                <Icon name="ArrowRight" className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Public speaking", "Chess", "Python", "Spanish"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCustom(s)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
