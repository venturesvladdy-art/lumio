import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"),
  subject: z.string().trim().min(1).max(300),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  // Prototype: log the submission. In production, forward this to your email
  // provider, CRM, or ticketing system (e.g. Resend, Postmark, a Slack webhook).
  console.log("[contact] new message:", {
    name: body.name,
    email: body.email,
    subject: body.subject,
    length: body.message.length,
  });

  return NextResponse.json({ ok: true });
}
