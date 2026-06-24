"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/Logo";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ResetInner />
    </Suspense>
  );
}

function Loader() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
    </div>
  );
}

function ResetInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 1600);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page grid min-h-[80vh] place-items-center py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lift sm:p-10">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-12 w-12" />
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
              Choose a new password
            </h1>
          </div>

          {!token ? (
            <p className="mt-7 text-center text-sm text-rose-600">
              This reset link is missing its token. Request a new one from{" "}
              <Link href="/forgot" className="font-medium text-brand-600 hover:underline">
                Forgot password
              </Link>
              .
            </p>
          ) : done ? (
            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-800">
              <Icon name="CheckCircle2" className="mx-auto h-6 w-6" />
              <p className="mt-2">Password updated — taking you to sign in…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-3">
              <Field
                label="New password"
                value={password}
                onChange={setPassword}
                placeholder="At least 8 characters"
              />
              <Field
                label="Confirm password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Re-enter your password"
              />
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-rose-600">
                  <Icon name="CircleHelp" className="h-4 w-4" />
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Saving…" : "Update password"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring"
      />
    </label>
  );
}
