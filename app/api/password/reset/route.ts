import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const PREFIX = "reset:";

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

/** Complete a password reset from the emailed token. */
export async function POST(req: Request) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const vt = await prisma.verificationToken.findUnique({
    where: { token: body.token },
  });
  if (!vt || !vt.identifier.startsWith(PREFIX) || vt.expires < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const email = vt.identifier.slice(PREFIX.length);
  const passwordHash = await bcrypt.hash(body.password, 10);

  // Bump the token version so every JWT issued before this reset is rejected
  // (Phase 6 session-revoke) — a stolen session can't outlive a password reset.
  await prisma.user.update({
    where: { email },
    data: { passwordHash, pwTokenVersion: { increment: 1 } },
  });
  await prisma.verificationToken.delete({ where: { token: body.token } }).catch(() => {});

  await prisma.auditEvent
    .create({ data: { type: "password.reset", data: { email } } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
