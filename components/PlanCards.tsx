"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCurrentUser } from "@/lib/session";
import { USE_DB } from "@/lib/flags";
import { PLANS, PLAN_ORDER, yearlySavingPct } from "@/lib/plans";
import type { PlanTier } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const RANK: Record<PlanTier, number> = { basic: 0, smart: 1, guru: 2 };

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "the end of your billing period";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "the end of your billing period"
    : d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function PlanCards({
  billing = "monthly",
}: {
  billing?: "monthly" | "yearly";
}) {
  const t = useT();
  const tx = useTx();
  const { state, setTier } = useStore();
  const { refresh } = useCurrentUser();
  const router = useRouter();
  const [busy, setBusy] = useState<PlanTier | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const choose = async (tier: PlanTier) => {
    if (!USE_DB) {
      // demo mode: switch instantly
      setTier(tier);
      router.push("/skills");
      return;
    }

    // Already free and choosing free → nothing to bill.
    if (tier === "basic" && state.tier === "basic") {
      router.push("/dashboard");
      return;
    }

    setBusy(tier);
    setNotice(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing }),
      });
      if (res.status === 401) {
        router.push("/login?next=/pricing");
        return;
      }
      if (res.status === 503) {
        // Billing not configured yet — show a friendly waitlist message, never a
        // raw "Billing not configured" error on a live pay button.
        setNotice({
          ok: true,
          text: "Paid plans are coming soon — you can keep learning on the free plan in the meantime, and we'll switch them on shortly.",
        });
        return;
      }
      if (res.status === 403) {
        // Email not confirmed yet — required before any paid action.
        setNotice({
          ok: false,
          text: "Please confirm your email first — check your inbox for the link, then come back to upgrade.",
        });
        return;
      }
      const j = await res.json().catch(() => ({}));

      // New subscription → Stripe-hosted payment page.
      if (j.url) {
        window.location.href = j.url;
        return;
      }

      if (j.action === "upgraded") {
        // Immediate upgrade — prorated charge taken from the card on file.
        await refresh();
        setNotice({ ok: true, text: `You're on ${PLANS[tier].name} now — enjoy!` });
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1300);
      } else if (j.action === "scheduled") {
        // Downgrade / cancel — takes effect at the end of the current period.
        await refresh();
        const dest = PLANS[(j.tier as PlanTier) ?? tier].name;
        setNotice({
          ok: true,
          text: `Your plan switches to ${dest} on ${formatDate(j.effectiveDate)}. You keep ${
            PLANS[state.tier].name
          } until then.`,
        });
      } else if (j.action === "none") {
        router.push("/dashboard");
      } else if (j.error) {
        setNotice({ ok: false, text: j.error });
      }
    } catch {
      setNotice({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {notice && (
        <div
          className={cn(
            "mx-auto mb-6 max-w-2xl rounded-2xl border px-5 py-4 text-sm",
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          )}
        >
          <div className="flex items-start gap-2">
            <Icon
              name={notice.ok ? "CheckCircle2" : "CircleHelp"}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{notice.text}</span>
          </div>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-3">
      {PLAN_ORDER.map((tier) => {
        const p = PLANS[tier];
        const price = billing === "monthly" ? p.priceMonthly : p.priceYearly;
        const isCurrent = state.tier === tier;
        const featured = p.highlight;

        return (
          <div
            key={tier}
            className={cn(
              "relative flex flex-col rounded-3xl border bg-white p-7 shadow-soft transition-shadow hover:shadow-lift",
              featured
                ? "border-brand-300 ring-2 ring-brand-100 lg:-mt-3 lg:mb-3"
                : "border-slate-200"
            )}
          >
            {featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Pill tone="brand" className="shadow-sm">
                  <Icon name="Sparkles" className="h-3.5 w-3.5" />
                  {t("common.mostPopular")}
                </Pill>
              </div>
            )}

            <h3 className="font-display text-xl font-semibold text-ink">
              {p.name}
            </h3>
            <p className="mt-1.5 min-h-[40px] text-sm text-slate-500">
              {tx(p.blurb)}
            </p>

            <div className="mt-5 flex items-end gap-1.5">
              {price === 0 ? (
                <span className="font-display text-4xl font-bold text-ink">
                  {t("common.free")}
                </span>
              ) : (
                <>
                  <span className="font-display text-4xl font-bold text-ink">
                    ${price}
                  </span>
                  <span className="mb-1.5 text-sm text-slate-500">
                    {billing === "monthly"
                      ? t("pricing.perMonth")
                      : t("pricing.perYear")}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 h-4 text-xs font-medium">
              {price === 0 ? (
                <span className="text-slate-400">{t("pricing.forever")}</span>
              ) : billing === "yearly" ? (
                <span className="text-emerald-600">
                  {t("pricing.billedYearly")} · −{yearlySavingPct(tier)}%
                </span>
              ) : (
                <span className="text-slate-400">
                  ${p.priceYearly} {t("pricing.perYear")} · −
                  {yearlySavingPct(tier)}%
                </span>
              )}
            </p>

            <Button
              variant={featured ? "primary" : "outline"}
              className="mt-6 w-full"
              disabled={isCurrent || busy === tier}
              onClick={() => choose(tier)}
            >
              {busy === tier
                ? t("common.loading")
                : isCurrent
                ? t("pricing.current")
                : !USE_DB || RANK[tier] > RANK[state.tier]
                ? t("pricing.choose", { plan: p.name })
                : tier === "basic"
                ? "Cancel plan"
                : `Switch to ${p.name}`}
            </Button>

            <ul className="mt-7 space-y-3">
              {p.features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-slate-600"
                >
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-50">
                    <Icon name="Check" className="h-3 w-3 text-brand-600" strokeWidth={3} />
                  </span>
                  <span>{tx(f)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      </div>
    </>
  );
}
