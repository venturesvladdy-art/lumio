import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SKILLS, getSkill } from "@/lib/skills";
import { getTasteBank } from "@/lib/taste/banks";
import { SkillLanding } from "@/components/SkillLanding";

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
  const hasTaste = Boolean(getTasteBank(id));

  return (
    <SkillLanding
      slug={id}
      name={name}
      tagline={skill.tagline.en}
      description={skill.description.en}
      topics={skill.topics.en}
      ctaHref={hasTaste ? `/try/${id}` : `/learn/${id}`}
      ctaLabel={hasTaste ? `Try ${name} free` : `Start ${name} free`}
      related={[
        ...SKILLS.filter((s) => s.predefined && s.id !== id)
          .slice(0, 5)
          .map((s) => ({ name: s.name.en, href: `/skills/${s.id}` })),
        { name: "All skills", href: "/skills" },
      ]}
    />
  );
}
