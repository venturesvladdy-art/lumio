import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerifyBanner } from "@/components/VerifyBanner";

// latin-ext is required for Polish glyphs (ł ś ż ć ą ę ó ń ź).
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skillsprinter.com"),
  title: {
    default: "SkillSprinter — Master any skill, one question at a time",
    template: "%s | SkillSprinter",
  },
  description:
    "AI-personalized, gamified test prep and skill learning — SAT, GMAT, GRE, Python, Spanish and more. Answer a few questions and get an adaptive plan that levels up as you learn.",
  applicationName: "SkillSprinter",
  keywords: [
    "SAT prep",
    "GMAT practice",
    "GRE prep",
    "test prep",
    "learn Python",
    "learn Spanish",
    "AI learning",
    "adaptive learning",
    "gamified learning",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "SkillSprinter",
    url: "/",
    locale: "en_US",
    title: "SkillSprinter — Master any skill, one question at a time",
    description:
      "AI-personalized, gamified learning. Pick a skill, answer a few questions, and get an adaptive plan that levels up as you learn.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillSprinter — Master any skill, one question at a time",
    description:
      "AI-personalized, gamified learning. Pick a skill, answer a few questions, and get an adaptive plan.",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://skillsprinter.com/#org",
      name: "SkillSprinter",
      url: "https://skillsprinter.com",
      logo: "https://skillsprinter.com/icon.svg",
    },
    {
      "@type": "WebSite",
      "@id": "https://skillsprinter.com/#website",
      url: "https://skillsprinter.com",
      name: "SkillSprinter",
      publisher: { "@id": "https://skillsprinter.com/#org" },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="flex min-h-screen flex-col bg-white font-sans text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Providers>
          <Navbar />
          <VerifyBanner />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
