"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { fetchSheetPermissions } from "../../_lib/si-registres-api";
import type { SheetPermissionEntry } from "../../_lib/si-registres-types";

type Props = {
  sheetUrl: string;
};

export function SheetAccessView({ sheetUrl }: Props) {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<SheetPermissionEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchSheetPermissions(sheetUrl).then((rows) => {
      if (!cancelled) {
        setPermissions(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sheetUrl]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Chargement des accès…
      </div>
    );
  }

  if (!permissions?.length) {
    return (
      <p className="text-sm text-muted-foreground whitespace-normal break-words">
        Aucune permission récupérée pour ce fichier.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {permissions.map((p) => (
        <li key={p.id} className="whitespace-normal break-words rounded-md border border-border px-3 py-2">
          <span className="font-medium">{p.displayName ?? p.emailAddress ?? p.type}</span>
          <span className="text-muted-foreground">
            {" "}
            — {p.role} ({p.type})
          </span>
        </li>
      ))}
    </ul>
  );
}
