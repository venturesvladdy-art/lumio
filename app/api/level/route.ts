import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Manual starting-level override per subarea — never Expert (earned only by Q&A).
const Schema = z.object({
  subareaKey: z.string().min(1),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

export async function POST(req: Request) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { subareaLevels: true } });
    const map = { ...((u?.subareaLevels ?? {}) as Record<string, string>) };
    map[body.subareaKey] = body.level;
    await prisma.user.update({ where: { id: userId }, data: { subareaLevels: map } });
  } catch (e) {
    console.error("[level] update failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
