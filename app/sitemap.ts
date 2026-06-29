import type { MetadataRoute } from "next";
import { SKILLS } from "@/lib/skills";
import { POSTS } from "@/lib/blog/posts";

const BASE = "https://www.skillsprinter.com";

/** XML sitemap of public, indexable pages (gated /dashboard and /learn are excluded). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    "",
    "/skills",
    "/pricing",
    "/about",
    "/try",
    "/blog",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
  ];

  // Per-skill SEO landing pages, exact-match exam pages, and blog posts.
  const skillPaths = SKILLS.filter((s) => s.predefined).map((s) => `/skills/${s.id}`);
  const examPaths = ["/skills/sat-prep", "/skills/gmat-prep", "/skills/gre-prep"];
  const blogPaths = POSTS.map((p) => `/blog/${p.slug}`);

  return [...staticPaths, ...skillPaths, ...examPaths, ...blogPaths].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" || path === "/skills" ? 0.8 : 0.6,
  }));
}
