"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import type { PlanTier, UserState } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export interface CurrentUser {
  email: string;
  name: string;
}

interface CurrentUserValue {
  user: CurrentUser | null;
  ready: boolean;
  signOut: () => void;
  /** Re-sync tier + progress from the server (after a purchase / promo). */
  refresh: () => Promise<void>;
}

const CurrentUserContext = createContext<CurrentUserValue | null>(null);

export function useCurrentUser(): CurrentUserValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within a session provider");
  }
  return ctx;
}

/** Redirect to /login (preserving destination) when there's no signed-in user. */
export function useRequireAuth(): { ready: boolean; user: CurrentUser | null } {
  const { user, ready } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [ready, user, router, pathname]);

  return { ready, user };
}

/** Demo mode: bridge the localStorage auth context into the unified shape. */
export function DemoSessionBridge({ children }: { children: React.ReactNode }) {
  const { user, ready, signOut } = useAuth();
  const value: CurrentUserValue = {
    user: user ? { email: user.email, name: user.name } : null,
    ready,
    signOut,
    refresh: async () => {},
  };
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/**
 * DB mode: bridge the Auth.js session into the unified shape. The database is
 * the source of truth, so we (a) mirror the authoritative tier from the session
 * for snappy gating, and (b) hydrate the full progress state from /api/state so
 * skills, XP and streaks follow the account across devices and reloads.
 */
export function DbSessionBridge({ children }: { children: React.ReactNode }) {
  const { data, status, update } = useSession();
  const { setTier, hydrateServerState } = useStore();

  const sessionUser = data?.user as
    | { email?: string | null; name?: string | null; tier?: PlanTier }
    | undefined;
  const tier = sessionUser?.tier;

  // Mirror tier immediately so gating UI reacts without waiting for /api/state.
  useEffect(() => {
    if (tier) setTier(tier);
  }, [tier, setTier]);

  // Pull the authoritative state for the signed-in user.
  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { state?: UserState };
        if (data.state) {
          hydrateServerState(data.state);
          return;
        }
      }
    } catch {
      /* fall through to a graceful, empty hydration */
    }
    // Never leave the store un-hydrated, or guarded pages hang on a spinner.
    hydrateServerState({
      tier: (tier as PlanTier) ?? "basic",
      xp: 0,
      streakDays: 0,
      lastActiveDate: null,
      dailyAnswered: 0,
      dailyDate: null,
      earnedBadges: [],
      skills: {},
      onboarded: false,
    });
  }, [hydrateServerState, tier]);

  useEffect(() => {
    if (status === "authenticated") void loadState();
  }, [status, loadState]);

  const refresh = useCallback(async () => {
    try {
      await update?.();
    } catch {
      /* ignore */
    }
    await loadState();
  }, [update, loadState]);

  const value: CurrentUserValue = {
    user: sessionUser?.email
      ? { email: sessionUser.email, name: sessionUser.name ?? sessionUser.email }
      : null,
    ready: status !== "loading",
    signOut: () => {
      void nextAuthSignOut({ callbackUrl: "/" });
    },
    refresh,
  };

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}
