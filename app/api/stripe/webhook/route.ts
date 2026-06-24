import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

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

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      tier,
      stripeSubscriptionId: sub.status === "canceled" ? null : sub.id,
      stripePriceId: active ? priceId ?? null : null,
      currentPeriodEnd: periodEndSec ? new Date(periodEndSec * 1000) : null,
    },
  });

  await prisma.auditEvent
    .create({
      data: {
        type: "subscription.synced",
        data: { customerId, status: sub.status, tier, priceId: priceId ?? null },
      },
    })
    .catch(() => {});
}
