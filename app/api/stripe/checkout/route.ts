import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  stripe,
  priceIdFor,
  tierRank,
  type Interval,
} from "@/lib/stripe";
import type { PlanTier } from "@/lib/types";

export const runtime = "nodejs";

/**
 * One endpoint for every plan change:
 *   • basic → paid (no card on file)  → hosted Stripe Checkout (payment page)
 *   • paid  → higher paid (upgrade)   → update the subscription NOW, charging the
 *                                        prorated difference to the card on file
 *   • paid  → lower paid (downgrade)  → scheduled to switch at the period end
 *   • paid  → basic (cancel)          → cancel at the period end
 * All subscriptions are recurring (monthly by default; yearly is also recurring).
 */
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

  // Email must be confirmed before any paid action (Proposal §5).
  const verified = Boolean((session?.user as { emailVerified?: boolean } | undefined)?.emailVerified);
  if (!verified) {
    return NextResponse.json(
      { error: "verify-required", message: "Confirm your email before upgrading." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const target: PlanTier | null =
    body.tier === "guru" ? "guru" : body.tier === "smart" ? "smart" : body.tier === "basic" ? "basic" : null;
  const interval: Interval = body.billing === "yearly" ? "year" : "month";
  if (!target) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const currentTier = (user?.tier as PlanTier) ?? "basic";

  // Retrieve the live subscription (if any) so we know its item id + period end.
  let sub: Stripe.Subscription | null = null;
  if (user?.stripeSubscriptionId) {
    try {
      sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    } catch {
      sub = null;
    }
    if (sub && !(sub.status === "active" || sub.status === "trialing" || sub.status === "past_due")) {
      sub = null;
    }
  }

  const periodEndSec = sub
    ? (sub as unknown as { current_period_end?: number }).current_period_end
    : undefined;
  const effectiveDate = periodEndSec ? new Date(periodEndSec * 1000).toISOString() : null;

  // ── No active subscription: free → paid means a fresh hosted checkout ──
  if (!sub) {
    if (target === "basic") {
      return NextResponse.json({ ok: true, action: "none", tier: "basic" });
    }
    const priceId = priceIdFor(target, interval);
    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured for that plan" },
        { status: 400 }
      );
    }

    let customerId = user?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const origin = new URL(req.url).origin;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: { userId, tier: target },
      subscription_data: { metadata: { userId } },
    });
    return NextResponse.json({ url: checkout.url });
  }

  // ── Has an active subscription ──
  if (target === currentTier) {
    return NextResponse.json({ ok: true, action: "none", tier: target });
  }

  const itemId = sub.items.data[0]?.id;
  const sc = stripe; // non-null inside closures below (guarded at the top)
  const releaseSchedule = async () => {
    if (sub?.schedule) {
      const id = typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
      await sc.subscriptionSchedules.release(id).catch(() => {});
    }
  };

  // UPGRADE — apply immediately and invoice the prorated difference now.
  if (tierRank(target) > tierRank(currentTier)) {
    const priceId = priceIdFor(target, interval);
    if (!priceId || !itemId) {
      return NextResponse.json({ error: "Price not configured for that plan" }, { status: 400 });
    }
    await releaseSchedule();
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "always_invoice",
      cancel_at_period_end: false,
    });
    await prisma.user.update({ where: { id: userId }, data: { pendingTier: null } });
    return NextResponse.json({ ok: true, action: "upgraded", tier: target });
  }

  // DOWNGRADE TO FREE — cancel at the end of the paid period.
  if (target === "basic") {
    await releaseSchedule();
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    await prisma.user.update({ where: { id: userId }, data: { pendingTier: "basic" } });
    return NextResponse.json({ ok: true, action: "scheduled", tier: "basic", effectiveDate });
  }

  // DOWNGRADE TO A LOWER PAID TIER — schedule the switch at the period end.
  const targetPriceId = priceIdFor(target, interval);
  if (!targetPriceId) {
    return NextResponse.json({ error: "Price not configured for that plan" }, { status: 400 });
  }
  const schedule = sub.schedule
    ? await stripe.subscriptionSchedules.retrieve(
        typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id
      )
    : await stripe.subscriptionSchedules.create({ from_subscription: sub.id });

  const current = schedule.phases[0];
  const currentPrice =
    typeof current.items[0].price === "string"
      ? current.items[0].price
      : current.items[0].price.id;

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: currentPrice, quantity: 1 }],
        start_date: current.start_date,
        end_date: current.end_date,
      },
      {
        items: [{ price: targetPriceId, quantity: 1 }],
      },
    ],
  });
  await prisma.user.update({ where: { id: userId }, data: { pendingTier: target } });
  return NextResponse.json({ ok: true, action: "scheduled", tier: target, effectiveDate });
}
