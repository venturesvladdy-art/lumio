import type { Metadata } from "next";
import { SkillLanding } from "@/components/SkillLanding";

export const metadata: Metadata = {
  title: "SAT Prep — Free Adaptive Practice Questions",
  description:
    "Prep for the SAT with AI-personalized practice — algebra, problem solving, reading and grammar — that adapts to your level and targets your weak spots. Free to start, no credit card.",
  alternates: { canonical: "/skills/sat-prep" },
  openGraph: {
    type: "website",
    title: "SAT Prep | SkillSprinter",
    description: "Free, adaptive SAT practice that targets your weak spots.",
    url: "/skills/sat-prep",
  },
};

export default function SatPrepPage() {
  return (
    <SkillLanding
      slug="sat-prep"
      name="SAT Prep"
      tagline="Raise your SAT score with focused, adaptive practice."
      description="Practice the exact skills the SAT rewards — algebra and functions, problem solving and data analysis, reading comprehension, and grammar and writing — with AI-personalized questions that adapt to your level and zero in on the areas costing you points."
      topics={[
        "Algebra & functions",
        "Problem solving & data",
        "Reading comprehension",
        "Grammar & writing",
        "Geometry & trig",
      ]}
      ctaHref="/try/exam"
      ctaLabel="Try free SAT questions"
      related={[
        { name: "GMAT Prep", href: "/skills/gmat-prep" },
        { name: "GRE Prep", href: "/skills/gre-prep" },
        { name: "Data & Statistics", href: "/skills/data" },
        { name: "All skills", href: "/skills" },
      ]}
    />
  );
}
