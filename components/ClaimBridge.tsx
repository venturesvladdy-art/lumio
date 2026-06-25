"use client";

import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/session";
import { USE_DB } from "@/lib/flags";
import { readPendingClaim, clearPendingClaim } from "@/lib/anon";

/**
 * After a guest signs up, claim any stashed anonymous taste progress into the
 * account exactly once (Proposal §2.5 / Phase 3), then re-sync state so the
 * welcome bonus shows up immediately.
 */
export function ClaimBridge() {
  const { user, ready, refresh } = useCurrentUser();
  const done = useRef(false);

  useEffect(() => {
    if (!USE_DB || !ready || !user || done.current) return;
    const pending = readPendingClaim();
    if (!pending) return;
    done.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonId: pending.anonId,
            skillId: pending.skillId,
            correctIds: pending.correctIds,
          }),
        });
        if (res.ok) {
          clearPendingClaim();
          await refresh();
        }
      } catch {
        /* leave the pending claim for a later attempt */
        done.current = false;
      }
    })();
  }, [ready, user, refresh]);

  return null;
}
