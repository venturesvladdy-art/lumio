"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useT } from "@/lib/i18n";
import { useAuth, tierForEmail, type AuthProviderId } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { USE_DB } from "@/lib/flags";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/Logo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[70vh] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
        </div>
      }
    >
      {USE_DB ? <DbLogin /> : <DemoLogin />}
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
      </div>
      <div className="container-page grid min-h-[80vh] place-items-center py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lift sm:p-10">
            <div className="flex flex-col items-center text-center">
              <LogoMark className="h-12 w-12" />
              <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
                {t("auth.title")}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{t("auth.subtitle")}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Real auth (DB mode) ─────────────── */
function DbLogin() {
  const t = useT();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) {
      setError(t("auth.invalidEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.passwordHint"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || t("auth.genericError"));
          return;
        }
      }
      const r = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (r?.error) {
        setError(mode === "signin" ? t("auth.badCredentials") : t("auth.genericError"));
        return;
      }
      router.push(decodeURIComponent(next));
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <button
        onClick={() => signIn("google", { callbackUrl: decodeURIComponent(next) })}
        className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white text-[15px] font-medium text-ink transition-colors hover:bg-slate-50 focusable"
      >
        <GoogleIcon className="h-5 w-5" />
        {t("auth.google")}
      </button>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wide text-slate-400">{t("auth.or")}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* mode toggle */}
      <div className="mb-5 inline-flex w-full rounded-full border border-slate-200 bg-slate-50 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              mode === m ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
            )}
          >
            {m === "signin" ? t("auth.signInTab") : t("auth.signUpTab")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <Field label={t("auth.nameLabel")} value={name} onChange={setName} placeholder={t("auth.namePlaceholder")} />
        )}
        <Field
          label={t("auth.emailLabel")}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t("auth.emailPlaceholder")}
        />
        <Field
          label={t("auth.passwordLabel")}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t("auth.passwordPlaceholder")}
        />
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-rose-600">
            <Icon name="CircleHelp" className="h-4 w-4" />
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy
            ? t("common.loading")
            : mode === "signin"
            ? t("auth.signInTab")
            : t("auth.signUpTab")}
          {!busy && <Icon name="ArrowRight" className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">{t("auth.legal")}</p>
    </Shell>
  );
}

/* ─────────────── Simulated auth (demo mode) ─────────────── */
function DemoLogin() {
  const t = useT();
  const router = useRouter();
  const search = useSearchParams();
  const { signIn: demoSignIn } = useAuth();
  const { setTier } = useStore();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState<null | "google" | "apple">(null);

  const finish = (rawEmail: string, displayName: string, provider: AuthProviderId) => {
    const e = rawEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) {
      setError(t("auth.invalidEmail"));
      return;
    }
    demoSignIn({ email: e, name: displayName, provider });
    const forced = tierForEmail(e);
    if (forced) setTier(forced);
    router.push(decodeURIComponent(next));
  };

  return (
    <>
      <Shell>
        <div className="mt-7 space-y-3">
          <button
            onClick={() => {
              setError("");
              setModal("google");
            }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white text-[15px] font-medium text-ink transition-colors hover:bg-slate-50 focusable"
          >
            <GoogleIcon className="h-5 w-5" />
            {t("auth.google")}
          </button>
          <button
            onClick={() => {
              setError("");
              setModal("apple");
            }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-ink text-[15px] font-medium text-white transition-colors hover:bg-ink/90 focusable"
          >
            <AppleIcon className="h-5 w-5" />
            {t("auth.apple")}
          </button>
        </div>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            finish(email, name, "email");
          }}
          className="space-y-3"
        >
          <Field
            label={t("auth.emailLabel")}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t("auth.emailPlaceholder")}
            autoFocus
          />
          <Field label={t("auth.nameLabel")} value={name} onChange={setName} placeholder={t("auth.namePlaceholder")} />
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-rose-600">
              <Icon name="CircleHelp" className="h-4 w-4" />
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={!email.trim()}>
            {t("auth.continueEmail")}
            <Icon name="ArrowRight" className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">{t("auth.legal")}</p>
      </Shell>

      <p className="-mt-8 mb-12 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <Icon name="Lock" className="h-3.5 w-3.5" />
        {t("auth.demoNote")}
      </p>

      {modal && (
        <ProviderModal
          provider={modal}
          defaultEmail={email}
          onClose={() => setModal(null)}
          onContinue={(e) => finish(e, "", modal)}
        />
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring"
      />
    </label>
  );
}

function ProviderModal({
  provider,
  defaultEmail,
  onClose,
  onContinue,
}: {
  provider: "google" | "apple";
  defaultEmail: string;
  onClose: () => void;
  onContinue: (email: string) => void;
}) {
  const t = useT();
  const [email, setEmail] = useState(defaultEmail);
  const label = provider === "google" ? "Google" : "Apple";

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-pop rounded-3xl border border-slate-200 bg-white p-7 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {provider === "google" ? (
            <GoogleIcon className="h-7 w-7" />
          ) : (
            <AppleIcon className="h-7 w-7 text-ink" />
          )}
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("auth.providerTitle", { provider: label })}
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">{t("auth.providerSubtitle")}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onContinue(email);
          }}
          className="mt-5 space-y-3"
        >
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring"
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {t("auth.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={!email.trim()}>
              {t("auth.providerContinue")}
            </Button>
          </div>
        </form>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <Icon name="Lock" className="h-3.5 w-3.5" />
          {t("auth.demoNote")}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76l4-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.06 1.68-3.05 1.76-3.1-0.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.03 8.23.68.99 1.5 2.1 2.56 2.06 1.03-.04 1.42-.66 2.66-.66 1.24 0 1.59.66 2.68.64 1.11-.02 1.81-1.01 2.49-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.18-3.05zM15.01 6.54c.56-.68.94-1.63.84-2.58-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.12z" />
    </svg>
  );
}
