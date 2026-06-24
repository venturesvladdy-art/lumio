"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { USE_DB } from "@/lib/flags";
import { PLANS, PLAN_ORDER, yearlySavingPct } from "@/lib/plans";
import type { PlanTier } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function PlanCards({
  billing = "monthly",
}: {
  billing?: "monthly" | "yearly";
}) {
  const t = useT();
  const tx = useTx();
  const { state, setTier } = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState<PlanTier | null>(null);

  const choose = async (tier: PlanTier) => {
    if (USE_DB) {
      if (tier === "basic") {
        router.push("/dashboard");
        return;
      }
      setBusy(tier);
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
        const j = await res.json().catch(() => ({}));
        if (j.url) {
          window.location.href = j.url;
          return;
        }
      } catch {
        /* ignore */
      }
      setBusy(null);
      return;
    }
    // demo mode: switch instantly
    setTier(tier);
    router.push("/skills");
  };

  return (
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
                : t("pricing.choose", { plan: p.name })}
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
  );
}
