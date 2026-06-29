/** Seed blog content for top-of-funnel SEO. Plain data so no MDX toolchain is needed. */

export interface BlogSection {
  h2?: string;
  p: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  readMins: number;
  excerpt: string;
  sections: BlogSection[];
  cta: { label: string; href: string };
}

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-study-for-the-sat",
    title: "How to Study for the SAT: A Smarter, Adaptive Approach",
    description:
      "Stop grinding random practice tests. Here's how to study for the SAT efficiently — with targeted, adaptive practice that fixes your weak spots first.",
    date: "2026-06-12",
    readMins: 5,
    excerpt:
      "Most SAT prep wastes time on what you already know. Here's a smarter way to raise your score.",
    sections: [
      {
        p: [
          "The SAT rewards a surprisingly small set of repeatable skills. The students who improve fastest aren't the ones who study the most hours — they're the ones who spend their hours on the right things.",
        ],
      },
      {
        h2: "Why most SAT prep is inefficient",
        p: [
          "Sitting through full-length tests and re-reading explanations feels productive, but most of that time is spent on questions you'd already get right. The points you're losing are concentrated in a few specific question types.",
          "Until you find and fix those, your score barely moves no matter how many tests you take.",
        ],
      },
      {
        h2: "Practice beats passive review",
        p: [
          "Learning science is clear on this: actively recalling and applying a concept builds durable skill far better than re-reading it. For the SAT, that means doing problems and getting immediate feedback — not watching someone else solve them.",
        ],
      },
      {
        h2: "Fix your weakest areas first",
        p: [
          "Keep a simple error log: every question you miss, note the topic and why. After a week, patterns appear — maybe it's systems of equations, or comma rules, or inference questions.",
          "Pour your practice into those areas. Adaptive tools do this automatically by serving you more of what you're getting wrong.",
        ],
      },
      {
        h2: "Make it a daily habit, not a cram",
        p: [
          "Twenty focused minutes a day beats a five-hour weekend session. Spaced, consistent practice is how the material actually sticks — and it's far less painful.",
        ],
      },
    ],
    cta: { label: "Start free SAT practice", href: "/skills/sat-prep" },
  },
  {
    slug: "learn-python-by-doing",
    title: "Learn Python Faster: Why Practice Beats Watching Tutorials",
    description:
      "Tutorial hell is real. Here's how to actually learn Python by doing — short, active practice that builds real coding intuition.",
    date: "2026-06-18",
    readMins: 4,
    excerpt:
      "You don't learn to code by watching. Here's the practice-first way to learn Python.",
    sections: [
      {
        p: [
          "Almost everyone who tries to learn Python starts the same way: a long video course. And almost everyone gets stuck in the same place — able to follow along, but unable to write anything from a blank file.",
        ],
      },
      {
        h2: "The tutorial trap",
        p: [
          "Watching someone code creates the feeling of understanding without the ability. The moment you face a blank editor, the recall just isn't there, because you never practiced retrieving it.",
        ],
      },
      {
        h2: "Active recall for code",
        p: [
          "The fix is to spend most of your time producing, not consuming. Answer a question, predict an output, fix a bug, write a one-liner. Each small act of recall is what actually wires the concept in.",
        ],
      },
      {
        h2: "Small reps, every day",
        p: [
          "You don't need an hour. A handful of short Python questions a day — variables, loops, functions, data structures — compounds quickly, and it's easy to keep up.",
        ],
      },
      {
        h2: "What to practice first",
        p: [
          "Start with the fundamentals you'll use in everything: variables and types, lists and dictionaries, loops, conditionals, and functions. Get fluent there before reaching for frameworks.",
        ],
      },
    ],
    cta: { label: "Practice Python free", href: "/skills/python" },
  },
  {
    slug: "gmat-quant-habits",
    title: "GMAT Quant: 5 Habits That Actually Raise Your Score",
    description:
      "Five evidence-based habits — from data-sufficiency drills to a real error log — that move your GMAT quant score.",
    date: "2026-06-24",
    readMins: 6,
    excerpt:
      "The GMAT quant section rewards habits, not cramming. Here are five that work.",
    sections: [
      {
        p: [
          "GMAT quant doesn't test advanced math — it tests how cleanly you reason under time pressure. These five habits do more for your score than another textbook ever will.",
        ],
      },
      {
        h2: "1. Master data sufficiency separately",
        p: [
          "Data sufficiency is its own skill. Drill it on its own until the answer-choice logic is automatic — that alone lifts a lot of scores.",
        ],
      },
      {
        h2: "2. Keep an error log",
        p: [
          "Write down every miss and the real reason: concept gap, careless slip, or time pressure. Review it weekly. Your log is the most personalized study guide you'll ever have.",
        ],
      },
      {
        h2: "3. Practice timed from the start",
        p: [
          "Untimed practice trains a pace you can't use on test day. Build the clock in early so your timing becomes instinct, not a panic.",
        ],
      },
      {
        h2: "4. Learn to estimate and eliminate",
        p: [
          "Many quant questions don't need exact computation. Estimating and eliminating answer choices is faster and cuts careless errors.",
        ],
      },
      {
        h2: "5. Short, daily reps",
        p: [
          "Consistency beats marathons. A focused set of questions each day keeps the concepts warm and steadily widens what you can solve on sight.",
        ],
      },
    ],
    cta: { label: "Practice GMAT free", href: "/skills/gmat-prep" },
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format an ISO date string deterministically, e.g. "2026-06-12" -> "June 12, 2026". */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
