import type { MetadataRoute } from "next";
import { SKILLS } from "@/lib/skills";

const BASE = "https://skillsprinter.com";

/** XML sitemap of public, indexable pages (gated /dashboard and /learn are excluded). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    "",
    "/skills",
    "/pricing",
    "/about",
    "/try",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
  ];

  // Per-skill "taste" landing pages for the predefined catalogue.
  const skillPaths = SKILLS.filter((s) => s.predefined).map((s) => `/try/${s.id}`);

  return [...staticPaths, ...skillPaths].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" || path === "/skills" ? 0.8 : 0.6,
  }));
}
