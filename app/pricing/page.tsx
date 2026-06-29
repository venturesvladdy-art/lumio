"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { USE_DB } from "@/lib/flags";
import { useCurrentUser } from "@/lib/session";
import { PlanCards } from "@/components/PlanCards";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Pill, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";

export default function PricingPage() {
  const t = useT();
  const [billing, setBilling] = useState<Billing>("monthly");

  const faqs = [
    { q: t("pricing.q1"), a: t("pricing.a1") },
    { q: t("pricing.q3"), a: t("pricing.a3") },
    { q: t("pricing.q4"), a: t("pricing.a4") },
  ];

  return (
    <div className="container-page py-14 lg:py-20">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <SectionLabel>{t("nav.pricing")}</SectionLabel>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {t("pricing.title")}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{t("pricing.subtitle")}</p>
      </div>

      {/* Billing toggle */}
      <div className="mt-9 flex items-center justify-center gap-3">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-soft">
          {(["monthly", "yearly"] as Billing[]).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors focusable",
                billing === b
                  ? "bg-ink text-white"
                  : "text-slate-500 hover:text-ink"
              )}
            >
              {t(`pricing.${b}`)}
            </button>
          ))}
        </div>
        <span
          className={cn(
            "transition-opacity",
            billing === "yearly" ? "opacity-100" : "opacity-60"
          )}
        >
          <Pill tone="emerald">
            <Icon name="Sparkles" className="h-3.5 w-3.5" />
            {t("pricing.saveBadge")}
          </Pill>
        </span>
      </div>

      {/* Plans */}
      <div className="mx-auto mt-12 max-w-5xl">
        <PlanCards billing={billing} />
      </div>

      {/* Promo code */}
      {USE_DB && <PromoCodeSection />}

      {/* FAQ */}
      <div className="mx-auto mt-24 max-w-3xl">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight text-ink">
          {t("pricing.faqTitle")}
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PromoCodeSection() {
  const { user, refresh } = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) {
        setMsg({ ok: true, text: "🎉 Guru plan activated — enjoy!" });
        // Refresh the session JWT + DB state so the new tier sticks, then go.
        await refresh();
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1400);
      } else {
        setMsg({ ok: false, text: data.error ?? "Something went wrong." });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-sm text-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline transition-colors"
        >
          Have a promo code?
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft text-left">
          <p className="mb-3 text-sm font-medium text-slate-700">Enter promo code</p>
          {!user ? (
            <p className="text-sm text-slate-500">
              Please{" "}
              <a href="/login?next=/pricing" className="font-medium text-brand-600 hover:underline">
                sign in
              </a>{" "}
              first to redeem a code.
            </p>
          ) : (
            <form onSubmit={redeem} className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                disabled={busy || !!msg?.ok}
                className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm uppercase tracking-widest text-ink outline-none transition-shadow placeholder:text-slate-300 focus:border-brand-400 focus:shadow-ring disabled:opacity-50"
              />
              <Button type="submit" size="sm" disabled={busy || !code.trim() || !!msg?.ok}>
                {busy ? "…" : "Redeem"}
              </Button>
            </form>
          )}
          {msg && (
            <p className={cn("mt-3 text-sm", msg.ok ? "text-emerald-600" : "text-rose-600")}>
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FaqItem({
  q,
  a,
  defaultOpen,
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focusable"
        aria-expanded={open}
      >
        <span className="font-display text-[17px] font-semibold text-ink">
          {q}
        </span>
        <Icon
          name="ChevronDown"
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-[15px] leading-relaxed text-slate-600">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}
