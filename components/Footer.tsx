"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Footer() {
  const t = useT();
  const year = 2026;

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t("footer.product"),
      links: [
        { label: t("nav.skills"), href: "/skills" },
        { label: t("nav.pricing"), href: "/pricing" },
        { label: t("nav.howItWorks"), href: "/#how" },
        { label: t("nav.dashboard"), href: "/dashboard" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.about"), href: "#" },
        { label: t("footer.blog"), href: "#" },
        { label: t("footer.careers"), href: "#" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.contact"), href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-slate-200 bg-paper">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500">
              {t("footer.tagline")}
            </p>
            <div className="mt-5">
              <LanguageSwitcher />
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-ink">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-500 transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <span>
            © {year} Lumio. {t("footer.rights")}
          </span>
          <span>{t("footer.builtWith")}</span>
        </div>
      </div>
    </footer>
  );
}
