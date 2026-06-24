"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/session";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/primitives";

export function Navbar() {
  const t = useT();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { label: t("nav.skills"), href: "/skills" },
    { label: t("nav.howItWorks"), href: "/#how" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.dashboard"), href: "/dashboard" },
  ];

  const isActive = (href: string) =>
    href !== "/" && pathname.startsWith(href.split("#")[0]) && href !== "/#how";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-slate-200 bg-white/80 backdrop-blur-xl"
          : "border-b border-transparent bg-white/0"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(l.href)
                  ? "text-ink"
                  : "text-slate-500 hover:text-ink hover:bg-slate-100"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-ink"
              >
                {t("nav.signIn")}
              </Link>
              <ButtonLink href="/skills" size="sm">
                {t("common.getStarted")}
              </ButtonLink>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-ink focusable"
          >
            <Icon name={open ? "X" : "Menu"} className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden animate-fade-in">
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <MobileAccount />
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                >
                  {t("nav.signIn")}
                </Link>
                <ButtonLink href="/skills" className="mt-2 w-full" size="lg">
                  {t("common.getStarted")}
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function initials(name: string, email: string): string {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 1).toUpperCase();
}

function AccountMenu() {
  const t = useT();
  const router = useRouter();
  const { user, signOut } = useCurrentUser();
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;
  const tier = PLANS[state.tier];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-semibold text-white focusable"
        aria-label={t("nav.account")}
        aria-expanded={open}
      >
        {initials(user.name, user.email)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right animate-fade-up rounded-2xl border border-slate-200 bg-white p-2 shadow-lift">
          <div className="rounded-xl px-3 py-3">
            <div className="truncate font-medium text-ink">{user.name}</div>
            <div className="truncate text-xs text-slate-500">{user.email}</div>
            <div className="mt-2">
              <Pill tone={state.tier === "guru" ? "violet" : state.tier === "smart" ? "brand" : "slate"}>
                <Icon name="Sparkles" className="h-3.5 w-3.5" />
                {tier.name}
              </Pill>
            </div>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <MenuLink href="/dashboard" icon="Gauge" label={t("nav.dashboard")} />
          <MenuLink href="/pricing" icon="TrendingUp" label={t("nav.pricing")} />
          <div className="my-1 h-px bg-slate-100" />
          <button
            onClick={() => {
              signOut();
              setOpen(false);
              router.push("/");
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Icon name="ArrowLeft" className="h-4 w-4" />
            {t("nav.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MobileAccount() {
  const t = useT();
  const router = useRouter();
  const { user, signOut } = useCurrentUser();
  const { state } = useStore();
  if (!user) return null;

  return (
    <div className="mt-2 rounded-2xl border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-semibold text-white">
          {initials(user.name, user.email)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{user.name}</div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
        </div>
      </div>
      <div className="mt-3">
        <Pill tone={state.tier === "guru" ? "violet" : state.tier === "smart" ? "brand" : "slate"}>
          <Icon name="Sparkles" className="h-3.5 w-3.5" />
          {PLANS[state.tier].name}
        </Pill>
      </div>
      <Button
        variant="outline"
        className="mt-3 w-full"
        onClick={() => {
          signOut();
          router.push("/");
        }}
      >
        {t("nav.signOut")}
      </Button>
    </div>
  );
}
