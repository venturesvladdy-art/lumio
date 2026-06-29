import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "SkillSprinter plans: Basic is free forever; Smart and Guru add unlimited skills, more daily questions, and progress tracking. Simple monthly or yearly pricing.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
