"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { startSiSheetExport, startSiSheetRecovery } from "../_lib/si-ticket-api";

export function SiRecoveryButton() {
  const [busyExport, setBusyExport] = useState(false);
  const [busyImport, setBusyImport] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busyExport || busyImport}
        onClick={() => {
          setBusyExport(true);
          void startSiSheetExport().finally(() => setBusyExport(false));
        }}
      >
        {busyExport ? <Spinner className="size-4" /> : "Exporter vers Sheet"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busyExport || busyImport}
        onClick={() => {
          setBusyImport(true);
          void startSiSheetRecovery().finally(() => setBusyImport(false));
        }}
      >
        {busyImport ? <Spinner className="size-4" /> : "Réimport Sheet"}
      </Button>
    </div>
  );
}
