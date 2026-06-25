"use client";

import React, { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/lib/i18n";
import { AppProvider, useStore } from "@/lib/store";
import { AuthProvider, tierForEmail, useAuth } from "@/lib/auth";
import { DemoSessionBridge, DbSessionBridge } from "@/lib/session";
import { ClaimBridge } from "@/components/ClaimBridge";
import { USE_DB } from "@/lib/flags";

/** Demo mode only: grant Guru to allowlisted accounts (mirrors a billing webhook). */
function AuthTierBridge() {
  const { user, ready } = useAuth();
  const { state, hydrated, setTier } = useStore();

  useEffect(() => {
    if (!ready || !hydrated || !user) return;
    const forced = tierForEmail(user.email);
    if (forced && state.tier !== forced) {
      setTier(forced);
    }
  }, [ready, hydrated, user, state.tier, setTier]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (USE_DB) {
    return (
      <LanguageProvider>
        <SessionProvider>
          <AppProvider dbMode>
            <DbSessionBridge>
              <ClaimBridge />
              {children}
            </DbSessionBridge>
          </AppProvider>
        </SessionProvider>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppProvider>
          <AuthTierBridge />
          <DemoSessionBridge>{children}</DemoSessionBridge>
        </AppProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
