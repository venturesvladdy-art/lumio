import type { Metadata } from "next";
import type { ReactNode } from "react";

// Gated learning flow (onboarding + sessions) — keep it out of the index.
export const metadata: Metadata = {
  title: "Learn",
  robots: { index: false, follow: false },
};

export default function LearnLayout({ children }: { children: ReactNode }) {
  return children;
}
