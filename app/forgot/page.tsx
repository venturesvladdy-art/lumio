"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/Logo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always succeed from the user's view (don't reveal who has an account).
      setSent(true);
    } catch {
      setSent(true);
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
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-800">
              <Icon name="MailCheck" className="mx-auto h-6 w-6" />
              <p className="mt-2">
                If an account exists for <span className="font-semibold">{email}</span>,
                a reset link is on its way. Check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring"
                />
              </label>
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-rose-600">
                  <Icon name="CircleHelp" className="h-4 w-4" />
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
                {!busy && <Icon name="ArrowRight" className="h-4 w-4" />}
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
