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
  title: "SkillSprinter — Master any skill, one question at a time",
  description:
    "AI-personalized, gamified learning. Choose a skill, answer a few quick questions, and get a custom plan that adapts as you learn. English & Polish.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="flex min-h-screen flex-col bg-white font-sans text-ink">
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
