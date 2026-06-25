import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** Re-send the confirmation email to the signed-in (still-unverified) user. */
export async function POST() {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Throttle re-sends per account (anti mail-bombing).
  if (!rateLimit(`resend:${userId}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Please wait before requesting another email." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "No email on file" }, { status: 400 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  await sendVerificationEmail(user.email);
  return NextResponse.json({ ok: true });
}
