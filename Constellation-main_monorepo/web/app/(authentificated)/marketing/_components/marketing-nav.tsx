"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/marketing", label: "Tableau de bord", exact: true },
  { href: "/marketing/linkedin", label: "LinkedIn" },
  { href: "/marketing/youtube", label: "YouTube" },
  { href: "/marketing/newsletter", label: "Newsletter" },
  { href: "/marketing/blog", label: "Blog Webflow" },
] as const;

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
      {ITEMS.map((item) => {
        const active =
          "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm whitespace-normal",
              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
