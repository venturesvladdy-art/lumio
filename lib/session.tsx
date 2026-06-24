"use client";

import React, { createContext, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import type { PlanTier } from "@/lib/types";
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
  };
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/**
 * DB mode: bridge the Auth.js session into the unified shape, and mirror the
 * authoritative tier from the session into the local store so all the existing
 * gating UI keeps working off `state.tier`.
 */
export function DbSessionBridge({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const { setTier } = useStore();

  const sessionUser = data?.user as
    | { email?: string | null; name?: string | null; tier?: PlanTier }
    | undefined;
  const tier = sessionUser?.tier;

  useEffect(() => {
    if (tier) setTier(tier);
  }, [tier, setTier]);

  const value: CurrentUserValue = {
    user: sessionUser?.email
      ? { email: sessionUser.email, name: sessionUser.name ?? sessionUser.email }
      : null,
    ready: status !== "loading",
    signOut: () => {
      void nextAuthSignOut({ callbackUrl: "/" });
    },
  };

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}
