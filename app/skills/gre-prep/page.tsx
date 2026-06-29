import type { Metadata } from "next";
import { SkillLanding } from "@/components/SkillLanding";

export const metadata: Metadata = {
  title: "GRE Prep — Free Adaptive Practice Questions",
  description:
    "Practice GRE quant and verbal — quantitative comparison, problem solving, text completion and reading — with AI-personalized questions tuned to your level. Free to start, no credit card.",
  alternates: { canonical: "/skills/gre-prep" },
  openGraph: {
    type: "website",
    title: "GRE Prep | SkillSprinter",
    description: "Free, adaptive GRE quant and verbal practice.",
    url: "/skills/gre-prep",
  },
};

export default function GrePrepPage() {
  return (
    <SkillLanding
      slug="gre-prep"
      name="GRE Prep"
      tagline="Build GRE quant and verbal skills that move your score."
      description="Practice the question types the GRE actually uses — quantitative comparison, problem solving, text completion, sentence equivalence, and reading comprehension — with AI-personalized questions that adapt to your level."
      topics={[
        "Quantitative comparison",
        "Problem solving",
        "Text completion",
        "Sentence equivalence",
        "Reading comprehension",
      ]}
      ctaHref="/try/exam"
      ctaLabel="Try free GRE questions"
      related={[
        { name: "GMAT Prep", href: "/skills/gmat-prep" },
        { name: "SAT Prep", href: "/skills/sat-prep" },
        { name: "Data & Statistics", href: "/skills/data" },
        { name: "All skills", href: "/skills" },
      ]}
    />
  );
}
