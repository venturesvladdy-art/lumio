import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe, priceIdFor, type Interval } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe || !prisma) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const email = session?.user?.email ?? undefined;
  if (!userId || !email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const tier = body.tier === "guru" ? "guru" : body.tier === "smart" ? "smart" : null;
  const interval: Interval = body.billing === "yearly" ? "year" : "month";
  if (!tier) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }
  const priceId = priceIdFor(tier, interval);
  if (!priceId) {
    return NextResponse.json(
      { error: "Price not configured for that plan" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  let customerId = user?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const origin = new URL(req.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: { userId, tier },
    subscription_data: { metadata: { userId } },
  });

  return NextResponse.json({ url: checkout.url });
}
