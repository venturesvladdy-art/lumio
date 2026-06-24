"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import type { Locale } from "@/lib/types";
import { dictionary } from "./dictionary";

type Vars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  ready: boolean;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolvePath(obj: unknown, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The app is English-only for now. Locale is fixed; the toggles are kept as
  // no-ops so the rest of the i18n API (useT/useTx/useLocale) stays stable and
  // Polish can be re-enabled later by restoring the locale state.
  const locale: Locale = "en";
  const ready = true;

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback(() => {}, []);
  const toggleLocale = useCallback(() => {}, []);

  const t = useCallback(
    (path: string, vars?: Vars) =>
      interpolate(resolvePath(dictionary[locale], path), vars),
    []
  );

  return (
    <I18nContext.Provider
      value={{ locale, ready, setLocale, toggleLocale, t }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function useLocale() {
  return useI18n().locale;
}

/** Hook returning a picker for inline bilingual content fields. */
export function useTx() {
  const { locale } = useI18n();
  return useCallback(
    function pick<T>(obj: { en: T; pl: T }): T {
      return obj[locale];
    },
    [locale]
  );
}
