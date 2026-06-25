import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlement";
import { getTasteBank } from "@/lib/taste/banks";

export const runtime = "nodejs";

/**
 * Claim anonymous guest progress into the signed-in account, ONCE, with caps
 * (Proposal §2.5 / Phase 3). Defensive by construction: XP is re-derived from
 * the real taste bank (never trusted from the client), capped, and the claim is
 * idempotent per anonId via User.claimedAnonIds.
 */

const CLAIM_XP_CAP = 300; // ~one level's worth — blocks fabricated-XP injection
const XP_BY_DIFF: Record<string, number> = { beginner: 10, intermediate: 15, advanced: 25 };

const Schema = z.object({
  anonId: z.string().min(1).max(80),
  skillId: z.string().min(1).max(80),
  correctIds: z.array(z.string().max(80)).max(50).default([]),
});

export async function POST(req: Request) {
  if (!prisma) return NextResponse.json({ ok: false }, { status: 503 });

  const ent = await getEntitlement();
  if (!ent) return NextResponse.json({ ok: false }, { status: 401 });

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: ent.userId },
      select: { claimedAnonIds: true },
    });
    const claimed = user?.claimedAnonIds ?? [];
    if (claimed.includes(body.anonId)) {
      return NextResponse.json({ ok: true, already: true, xpClaimed: 0 });
    }

    // Re-derive the credit from the real bank — validate each claimed id and
    // sum its true XP, capping the total. Build synthetic, deduped attempts.
    const bank = getTasteBank(body.skillId);
    const byId = new Map((bank?.questions ?? []).map((q) => [q.id, q]));
    const seen = new Set<string>();
    let xpClaimed = 0;
    const attempts: {
      userId: string;
      skillId: string;
      subareaKey: string;
      concept: string;
      questionClientId: string;
      type: string;
      correct: boolean;
      xpGained: number;
    }[] = [];

    for (const id of body.correctIds) {
      if (seen.has(id)) continue;
      const q = byId.get(id);
      if (!q) continue;
      const xp = XP_BY_DIFF[q.difficulty] ?? 10;
      if (xpClaimed + xp > CLAIM_XP_CAP) break;
      seen.add(id);
      xpClaimed += xp;
      attempts.push({
        userId: ent.userId,
        skillId: body.skillId,
        subareaKey: `${body.skillId}:${q.areaKey}`,
        concept: q.id,
        questionClientId: `claim-${id}`,
        type: q.format,
        correct: true,
        xpGained: xp,
      });
    }

    // Persist the claim atomically: synthetic attempts + idempotency marker.
    await prisma.$transaction([
      ...attempts.map((a) => prisma!.attempt.create({ data: a })),
      prisma.user.update({
        where: { id: ent.userId },
        data: { claimedAnonIds: { push: body.anonId } },
      }),
      prisma.auditEvent.create({
        data: {
          userId: ent.userId,
          type: "anon.claim",
          data: { anonId: body.anonId, skillId: body.skillId, xpClaimed, count: attempts.length },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, xpClaimed, count: attempts.length });
  } catch (e) {
    console.error("[claim] failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
