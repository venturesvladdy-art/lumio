import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Valid codes live server-side only — never reach the client bundle.
const CODES: Record<string, "guru" | "smart"> = {
  VLADDYXOXO: "guru",
};

export async function POST(req: Request) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { code?: string };
  const normalised = String(body.code ?? "").trim().toUpperCase();
  const tier = CODES[normalised];

  if (!tier) {
    return NextResponse.json({ error: "Invalid promo code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  if (user?.tier === tier) {
    return NextResponse.json(
      { error: "You're already on the Guru plan — nice!" },
      { status: 409 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tier },
  });

  await prisma.auditEvent
    .create({
      data: {
        userId,
        type: "promo.redeemed",
        data: { code: normalised, tier },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true, tier });
}
