import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  // Store it so nothing is lost even if email delivery fails.
  if (prisma) {
    await prisma.auditEvent
      .create({
        data: {
          type: "contact.message",
          data: {
            name: body.name,
            email: body.email,
            subject: body.subject,
            message: body.message,
          },
        },
      })
      .catch((e) => console.error("[contact] store failed:", e));
  }

  // Email it to the inbox you can actually receive at (set CONTACT_EMAIL).
  const to = process.env.CONTACT_EMAIL;
  if (to) {
    await sendEmail({
      to,
      replyTo: body.email,
      subject: `[SkillSprinter contact] ${body.subject}`,
      html: `<div style="font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#0f172a">
        <p><strong>From:</strong> ${escapeHtml(body.name)} &lt;${escapeHtml(body.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(body.subject)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="white-space:pre-line;line-height:1.6">${escapeHtml(body.message)}</p>
      </div>`,
    }).catch((e) => console.error("[contact] email failed:", e));
  } else {
    console.warn("[contact] CONTACT_EMAIL not set — message stored but not emailed.");
  }

  return NextResponse.json({ ok: true });
}
