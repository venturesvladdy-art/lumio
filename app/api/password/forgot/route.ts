import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().trim().email(),
});

/** Start a password reset. Always responds ok so we never leak who has an account. */
export async function POST(req: Request) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Throttle reset emails per IP (anti mail-bombing via the real Resend key).
  if (!rateLimit(`forgot:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true }); // uniform response, silently dropped
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = body.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // Only send when the account exists AND uses a password (not OAuth-only).
  if (user?.passwordHash) {
    await sendPasswordResetEmail(email).catch((e) =>
      console.error("[password/forgot] send failed:", e)
    );
  }

  return NextResponse.json({ ok: true });
}
