import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Permanently delete the signed-in user and everything tied to them.
 * Curricula → Questions, Attempts, Accounts and Sessions cascade from the User
 * row (see schema). AuditEvents are SetNull on delete, so we remove them
 * explicitly to leave nothing behind.
 */
export async function DELETE() {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await prisma.auditEvent.deleteMany({ where: { userId } });
    // Deleting the user cascades curricula (→ questions), attempts, accounts,
    // and sessions via onDelete: Cascade.
    await prisma.user.delete({ where: { id: userId } });
  } catch (e) {
    console.error("[account] delete failed:", e);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
