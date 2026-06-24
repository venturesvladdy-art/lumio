"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card, SectionLabel } from "@/components/ui/primitives";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(t("contact.required"));
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t("contact.invalidEmail"));
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch {
      setStatus("error");
      setError(t("contact.required"));
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setStatus("idle");
    setError("");
  };

  return (
    <div className="container-page py-14 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <SectionLabel>{t("footer.contact")}</SectionLabel>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {t("contact.title")}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{t("contact.subtitle")}</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Form */}
        <Card className="p-7 sm:p-8">
          {status === "sent" ? (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div className="animate-fade-up">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
                  <Icon name="CheckCircle2" className="h-8 w-8" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-bold text-ink">
                  {t("contact.sentTitle")}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-slate-600">
                  {t("contact.sentDesc")}
                </p>
                <Button variant="outline" className="mt-7" onClick={reset}>
                  {t("contact.another")}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("contact.name")}
                  value={name}
                  onChange={setName}
                  placeholder={t("contact.namePlaceholder")}
                />
                <Field
                  label={t("contact.email")}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder={t("contact.emailPlaceholder")}
                />
              </div>
              <Field
                label={t("contact.subject")}
                value={subject}
                onChange={setSubject}
                placeholder={t("contact.subjectPlaceholder")}
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t("contact.message")}
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("contact.messagePlaceholder")}
                  rows={5}
                  className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring"
                />
              </label>

              {error && (
                <p className="flex items-center gap-1.5 text-sm text-rose-600">
                  <Icon name="CircleHelp" className="h-4 w-4" />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={status === "sending"}
              >
                {status === "sending" ? t("contact.sending") : t("contact.send")}
                {status !== "sending" && <Icon name="ArrowRight" className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </Card>

        {/* Info */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("contact.infoTitle")}
          </h2>
          <InfoRow
            icon="MessageSquare"
            label={t("contact.emailUs")}
            value="hello@skillsprinter.com"
          />
          <InfoRow
            icon="Calendar"
            label={t("contact.response")}
            value={t("contact.responseValue")}
          />
          <InfoRow icon="Compass" label={t("contact.hq")} value="Remote-first · Worldwide" />
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-ink outline-none transition-shadow",
          "placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring"
        )}
      />
    </label>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
        <div className="truncate font-medium text-ink">{value}</div>
      </div>
    </Card>
  );
}
