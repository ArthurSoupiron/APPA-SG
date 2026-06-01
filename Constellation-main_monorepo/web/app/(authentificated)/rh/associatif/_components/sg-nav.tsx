"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/rh/associatif", label: "Tableau de bord", exact: true },
  { href: "/rh/associatif/membres", label: "Membres" },
  { href: "/rh/associatif/documents", label: "Documents (GED)" },
  { href: "/rh/associatif/conformite", label: "Conformité" },
  { href: "/rh/associatif/journal", label: "Journal" },
  { href: "/rh/associatif/parametres", label: "Paramètres" },
] as const;

export function SgNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
      {ITEMS.map((item) => {
        const active =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm whitespace-normal transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
