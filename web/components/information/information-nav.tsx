"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cgu", label: "CGU" },
  { href: "/a-propos", label: "À propos" },
] as const;

export function InformationNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Pages d'information"
      className="flex max-w-[min(100%,28rem)] flex-wrap justify-end gap-x-1 gap-y-1.5 sm:max-w-none sm:justify-start sm:gap-x-2"
    >
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-[color,background-color,box-shadow]",
              active
                ? "bg-brand/15 font-medium text-brand ring-1 ring-brand/25 dark:bg-brand/20 dark:ring-brand/30"
                : "text-muted-foreground hover:bg-muted/90 hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
