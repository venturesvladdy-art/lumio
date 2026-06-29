import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Browse Skills",
  description:
    "Practice SAT, GMAT and GRE prep, Python, Spanish, public speaking, personal finance, AI and more — one adaptive, AI-personalized question at a time.",
  alternates: { canonical: "/skills" },
};

export default function SkillsLayout({ children }: { children: ReactNode }) {
  return children;
}
