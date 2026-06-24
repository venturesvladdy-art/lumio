import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Email + token helpers for account confirmation and password reset.
 * Server-only. Email is sent through Resend's HTTP API (no SDK dependency).
 */

const FROM = process.env.EMAIL_FROM || "SkillSprinter <onboarding@resend.dev>";

/** Absolute base URL for links in emails (set AUTH_URL in production). */
export function appBaseUrl(): string {
  const url =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set; skipping send to", opts.to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send error", e);
    return false;
  }
}

/** Create a single fresh token for an identifier, invalidating any older ones. */
async function freshToken(identifier: string, hours: number): Promise<string | null> {
  if (!prisma) return null;
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + hours * 3600 * 1000);
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });
  return token;
}

function shell(title: string, body: string, cta: { href: string; label: string }): string {
  return `<div style="font-family:ui-sans-serif,system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 20px">${body}</p>
    <a href="${cta.href}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:9999px">${cta.label}</a>
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0">If the button doesn't work, paste this link into your browser:<br/>${cta.href}</p>
  </div>`;
}

/** Email a confirmation link. Token lives under "verify:<email>" for 24h. */
export async function sendVerificationEmail(email: string): Promise<void> {
  const token = await freshToken(`verify:${email}`, 24);
  if (!token) return;
  const link = `${appBaseUrl()}/api/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Confirm your SkillSprinter email",
    html: shell(
      "Confirm your email",
      "Welcome to SkillSprinter! Tap below to confirm your email address and secure your account.",
      { href: link, label: "Confirm email" }
    ),
  });
}

/** Email a password-reset link. Token lives under "reset:<email>" for 1h. */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const token = await freshToken(`reset:${email}`, 1);
  if (!token) return;
  const link = `${appBaseUrl()}/reset?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your SkillSprinter password",
    html: shell(
      "Reset your password",
      "We received a request to reset your password. This link expires in 1 hour. If you didn't ask for this, you can ignore this email.",
      { href: link, label: "Reset password" }
    ),
  });
}
