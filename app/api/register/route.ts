import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { tierForEmail } from "@/lib/allowlist";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

const Schema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid input. Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const email = body.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const tier = tierForEmail(email) ?? "basic";

  const user = await prisma.user.create({
    data: { email, name: body.name ?? null, passwordHash, tier },
  });

  await prisma.auditEvent
    .create({
      data: {
        userId: user.id,
        type: "user.registered",
        data: { provider: "credentials" },
      },
    })
    .catch(() => {});

  // Fire a confirmation email (best-effort; never blocks sign-up).
  await sendVerificationEmail(email).catch((e) =>
    console.error("[register] verification email failed:", e)
  );

  return NextResponse.json({ ok: true });
}
