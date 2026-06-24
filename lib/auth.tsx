"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AuthProviderId = "email" | "google" | "apple";

export interface AuthUser {
  email: string;
  name: string;
  provider: AuthProviderId;
  createdAt: number;
}

const STORAGE_KEY = "lumio.auth.v1";

// Guru allowlist lives in a server-safe module so Auth.js can reuse it.
export { tierForEmail } from "@/lib/allowlist";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (input: { email: string; name?: string; provider: AuthProviderId }) => AuthUser;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "Learner";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = useCallback(
    ({ email, name, provider }: { email: string; name?: string; provider: AuthProviderId }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const next: AuthUser = {
        email: normalizedEmail,
        name: (name && name.trim()) || nameFromEmail(normalizedEmail),
        provider,
        createdAt: Date.now(),
      };
      setUser(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
