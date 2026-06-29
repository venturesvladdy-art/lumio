import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, getPost, formatPostDate } from "@/lib/blog/posts";

const BASE = "https://skillsprinter.com";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "SkillSprinter", url: BASE },
    publisher: {
      "@type": "Organization",
      name: "SkillSprinter",
      url: BASE,
      logo: { "@type": "ImageObject", url: `${BASE}/icon.svg` },
    },
    mainEntityOfPage: `${BASE}/blog/${slug}`,
  };

  return (
    <article className="container-page py-14 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-2xl">
        <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/blog" className="hover:text-brand-600">
            Blog
          </Link>
          <span className="px-2">/</span>
          <span className="text-ink">{post.title}</span>
        </nav>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {formatPostDate(post.date)} · {post.readMins} min read
        </p>

        <div className="mt-8 space-y-6">
          {post.sections.map((s, i) => (
            <section key={i}>
              {s.h2 && (
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                  {s.h2}
                </h2>
              )}
              {s.p.map((para, j) => (
                <p key={j} className="mt-3 text-[17px] leading-relaxed text-slate-700">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl bg-ink p-8 text-center text-white">
          <p className="font-display text-xl font-semibold">Ready to practice?</p>
          <p className="mt-2 text-slate-300">Free to start. No credit card needed.</p>
          <Link
            href={post.cta.href}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.02]"
          >
            {post.cta.label}
          </Link>
        </div>

        <div className="mt-10">
          <Link href="/blog" className="text-sm font-semibold text-brand-600 hover:underline">
            ← All posts
          </Link>
        </div>
      </div>
    </article>
  );
}
