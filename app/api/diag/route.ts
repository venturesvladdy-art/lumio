import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Temporary diagnostic: visit /api/diag while signed in and share the JSON.
 * Reports config, auth, table row counts, and a throwaway test write so we can
 * pinpoint why curricula aren't persisting. Leaks no secrets. Remove later.
 */
export async function GET() {
  const out: Record<string, unknown> = {
    env: {
      NEXT_PUBLIC_USE_DB: process.env.NEXT_PUBLIC_USE_DB ?? null,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? null,
    },
  };

  if (!prisma) {
    out.error = "prisma is null (DATABASE_URL not set in this environment)";
    return NextResponse.json(out);
  }

  // Auth status (the prime suspect: if this is false in the route, nothing saves)
  let userId: string | undefined;
  try {
    const session = await auth();
    const u = session?.user as { id?: string; email?: string } | undefined;
    userId = u?.id;
    out.auth = { authenticated: Boolean(userId), userId: userId ?? null, email: u?.email ?? null };
  } catch (e) {
    out.auth = { error: String(e) };
  }

  // Row counts per table (errors here reveal a missing table / migration)
  const counts: Record<string, unknown> = {};
  const tables: [string, () => Promise<number>][] = [
    ["user", () => prisma!.user.count()],
    ["curriculum", () => prisma!.curriculum.count()],
    ["question", () => prisma!.question.count()],
    ["brief", () => prisma!.brief.count()],
    ["attempt", () => prisma!.attempt.count()],
  ];
  for (const [name, fn] of tables) {
    try {
      counts[name] = await fn();
    } catch (e) {
      counts[name] = { error: String(e).slice(0, 300) };
    }
  }
  out.counts = counts;

  // Throwaway test write (legacy shape) to surface the exact insert error.
  if (userId) {
    try {
      const c = await prisma.curriculum.create({
        data: {
          userId,
          skillId: "__diag__",
          skillName: "Diag",
          level: "beginner",
          focus: [],
          summaryEn: "diag",
          summaryPl: "diag",
          totalPlanned: 0,
          source: "diag",
        },
        select: { id: true },
      });
      await prisma.curriculum.delete({ where: { id: c.id } }).catch(() => {});
      out.testWrite = { ok: true };
    } catch (e) {
      out.testWrite = { ok: false, error: String(e).slice(0, 500) };
    }
  } else {
    out.testWrite = { skipped: "not authenticated in this route" };
  }

  return NextResponse.json(out);
}
