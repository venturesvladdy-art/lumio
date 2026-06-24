import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREFIX = "verify:";

/** Confirm an email from the link we sent. Sets emailVerified, then redirects. */
export async function GET(req: Request) {
  const base = appBaseUrl();
  const token = new URL(req.url).searchParams.get("token");

  if (!prisma || !token) {
    return NextResponse.redirect(`${base}/login?verify=invalid`);
  }

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt || !vt.identifier.startsWith(PREFIX)) {
    return NextResponse.redirect(`${base}/login?verify=invalid`);
  }
  if (vt.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.redirect(`${base}/login?verify=expired`);
  }

  const email = vt.identifier.slice(PREFIX.length);
  await prisma.user
    .update({ where: { email }, data: { emailVerified: new Date() } })
    .catch(() => {});
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  return NextResponse.redirect(`${base}/dashboard?verified=1`);
}
