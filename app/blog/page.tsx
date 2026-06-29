import type { Metadata } from "next";
import Link from "next/link";
import { POSTS, formatPostDate } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog — Study Tips & Learning Guides",
  description:
    "Practical study tips and learning guides for the SAT, GMAT, GRE, Python, Spanish and more — from the team at SkillSprinter.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "SkillSprinter Blog — Study Tips & Learning Guides",
    description: "Practical study tips and learning guides for the SAT, GMAT, Python and more.",
    url: "/blog",
  },
};

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="container-page py-14 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Blog</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Study tips &amp; learning guides
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Smarter ways to study, practice, and actually remember what you learn.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
          >
            <p className="text-xs font-medium text-slate-400">
              {formatPostDate(post.date)} · {post.readMins} min read
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink group-hover:text-brand-700">
              {post.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">{post.excerpt}</p>
            <span className="mt-4 text-sm font-semibold text-brand-600">Read →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
