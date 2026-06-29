import type { Metadata } from "next";
import { SkillLanding } from "@/components/SkillLanding";

export const metadata: Metadata = {
  title: "GMAT Prep — Free Adaptive Practice Questions",
  description:
    "Practice GMAT quant and verbal — problem solving, data sufficiency, critical reasoning and sentence correction — with adaptive questions that scale to your target score. Free to start.",
  alternates: { canonical: "/skills/gmat-prep" },
  openGraph: {
    type: "website",
    title: "GMAT Prep | SkillSprinter",
    description: "Free, adaptive GMAT quant and verbal practice.",
    url: "/skills/gmat-prep",
  },
};

export default function GmatPrepPage() {
  return (
    <SkillLanding
      slug="gmat-prep"
      name="GMAT Prep"
      tagline="Crack GMAT quant and verbal for top business schools."
      description="Sharpen the reasoning the GMAT tests — problem solving, data sufficiency, critical reasoning, and sentence correction — with AI-personalized questions that adapt to your level and build toward your target score."
      topics={[
        "Problem solving",
        "Data sufficiency",
        "Critical reasoning",
        "Sentence correction",
        "Integrated reasoning",
      ]}
      ctaHref="/try/exam"
      ctaLabel="Try free GMAT questions"
      related={[
        { name: "GRE Prep", href: "/skills/gre-prep" },
        { name: "SAT Prep", href: "/skills/sat-prep" },
        { name: "Data & Statistics", href: "/skills/data" },
        { name: "All skills", href: "/skills" },
      ]}
    />
  );
}
