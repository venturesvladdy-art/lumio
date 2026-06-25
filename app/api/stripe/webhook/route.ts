import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { regenerateCurriculaForUser } from "@/lib/regenerate";
import type { PlanTier } from "@/lib/types";

/**
 * What plan change (if any) is scheduled to apply at the end of the period.
 * Returns "basic" for a pending cancellation, a lower paid tier for a scheduled
 * downgrade, or null when nothing is pending.
 */
async function pendingTierFor(sub: Stripe.Subscription): Promise<PlanTier | null> {
  if (sub.cancel_at_period_end) return "basic";
  if (!sub.schedule || !stripe) return null;
  try {
    const id = typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
    const sched = await stripe.subscriptionSchedules.retrieve(id);
    if (sched.status !== "active" && sched.status !== "not_started") return null;
    const nowSec = Date.now() / 1000;
    const future = sched.phases.find((p) => p.start_date > nowSec);
    const priceRef = future?.items[0]?.price;
    const priceId = typeof priceRef === "string" ? priceRef : priceRef?.id;
    return tierForPriceId(priceId);
  } catch {
    return null;
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!stripe || !prisma) {
    return NextResponse.json({ received: true });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event =
      secret && sig
        ? stripe.webhooks.constructEvent(raw, sig, secret)
        : (JSON.parse(raw) as Stripe.Event);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (typeof cs.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(cs.subscription);
          await syncSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription) {
  if (!prisma) return;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id;
  const active = sub.status === "active" || sub.status === "trialing";
  const tier = active ? tierForPriceId(priceId) ?? "basic" : "basic";
  const periodEndSec = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const pendingTier = active ? await pendingTierFor(sub) : null;

  // Find the affected users first so we can detect a tier upgrade.
  const before = await prisma.user.findMany({
    where: { stripeCustomerId: customerId },
    select: { id: true, tier: true },
  });

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      tier,
      stripeSubscriptionId: sub.status === "canceled" ? null : sub.id,
      stripePriceId: active ? priceId ?? null : null,
      currentPeriodEnd: periodEndSec ? new Date(periodEndSec * 1000) : null,
      pendingTier,
    },
  });

  // On an upgrade into a paid tier, rebuild plans with the Opus model.
  if (tier === "smart" || tier === "guru") {
    for (const u of before) {
      if (u.tier !== tier) {
        await regenerateCurriculaForUser(u.id, tier as PlanTier).catch(() => 0);
      }
    }
  }

  await prisma.auditEvent
    .create({
      data: {
        type: "subscription.synced",
        data: { customerId, status: sub.status, tier, priceId: priceId ?? null },
      },
    })
    .catch(() => {});
}
