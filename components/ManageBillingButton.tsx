"use client";

import { useState } from "react";
import { USE_DB } from "@/lib/flags";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Opens the Stripe Customer Portal (DB mode only). */
export function ManageBillingButton() {
  const t = useT();
  const [busy, setBusy] = useState(false);

  if (!USE_DB) return null;

  const open = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (j.url) {
        window.location.href = j.url;
        return;
      }
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-3 w-full"
      onClick={open}
      disabled={busy}
    >
      <Icon name="Settings2" className="h-4 w-4" />
      {busy ? t("common.loading") : t("dashboard.manageBilling")}
    </Button>
  );
}
