import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Contenu principal des pages sous {@link AccountAppShell} (zone `.jm-app-viewport`) :
 * pleine largeur, aligné au début ; colonne flex pour remplir la hauteur disponible.
 */
export function AccountPageMain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-1 flex-col px-4 py-6 text-left sm:px-6",
        className,
      )}
    >
      {children}
    </main>
  );
}
