import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { reconstructUserState } from "@/lib/serverState";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authoritative client state for the signed-in user (DB mode). */
export async function GET() {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const state = await reconstructUserState(userId);
  return NextResponse.json({ state });
}
