"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/session";
import { USE_DB } from "@/lib/flags";
import { Icon } from "@/components/ui/Icon";

/**
 * Soft reminder for signed-in users who haven't confirmed their email yet.
 * Non-blocking (per the chosen gating): they can keep using the app.
 */
export function VerifyBanner() {
  const { user } = useCurrentUser();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!USE_DB || !user || user.emailVerified) return null;

  const resend = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/verify/resend", { method: "POST" });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm text-amber-800">
        <span className="flex items-center gap-1.5">
          <Icon name="Mail" className="h-4 w-4" />
          Confirm your email to secure your account.
        </span>
        {state === "sent" ? (
          <span className="font-medium text-emerald-700">Confirmation sent — check your inbox.</span>
        ) : (
          <button
            onClick={resend}
            disabled={state === "sending"}
            className="font-semibold underline underline-offset-2 hover:text-amber-900 disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Resend email"}
          </button>
        )}
        {state === "error" && (
          <span className="text-rose-600">Couldn&apos;t send — try again shortly.</span>
        )}
      </div>
    </div>
  );
}
