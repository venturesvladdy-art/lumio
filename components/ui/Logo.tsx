import Link from "next/link";
import { cn } from "@/lib/utils";

/** The SkillSprinter mark: a rounded gradient tile with a spark cut into it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none" aria-hidden="true">
        <path
          d="M12 2.5l1.9 5.4a4 4 0 0 0 2.3 2.3l5.3 1.8-5.3 1.9a4 4 0 0 0-2.3 2.3L12 21.5l-1.9-5.4a4 4 0 0 0-2.3-2.3L2.5 12l5.3-1.8a4 4 0 0 0 2.3-2.3L12 2.5z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 focusable rounded-full",
        className
      )}
      aria-label="SkillSprinter home"
    >
      <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:rotate-[8deg]" />
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        SkillSprinter
      </span>
    </Link>
  );
}
