"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchGoogleIntegrationStatus } from "../_lib/si-ticket-api";

export function SiGoogleIntegrationBanner() {
  const [gaps, setGaps] = useState<string[] | null>(null);

  useEffect(() => {
    void fetchGoogleIntegrationStatus().then((s) => {
      if (!s) return;
      if (!s.linked || s.gaps.length > 0) {
        setGaps(s.linked ? s.gaps : ["google_account"]);
      } else {
        setGaps(null);
      }
    });
  }, []);

  if (!gaps?.length) return null;

  return (
    <Alert variant="destructive" className="whitespace-normal break-words">
      <AlertTitle>Connexion Google requise</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Les tickets SI utilisent votre compte Google pour créer les dossiers Drive et synchroniser
          la sauvegarde Sheets. Reconnectez-vous avec Google pour accorder les accès Drive et
          Spreadsheets.
        </p>
        <Link href="/account/settings" className="font-medium underline underline-offset-4">
          Ouvrir les paramètres du compte
        </Link>
      </AlertDescription>
    </Alert>
  );
}
