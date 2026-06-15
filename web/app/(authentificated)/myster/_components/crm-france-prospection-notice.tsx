"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/**
 * Rappel indicatif sur le démarchage téléphonique en France (plages horaires usuelles).
 * Ne remplace pas un conseil juridique.
 */
export function CrmFranceProspectionNotice({ className }: { className?: string }) {
  return (
    <Alert
      variant="default"
      className={cn(
        "border-primary/20 bg-primary/5 py-2 text-foreground [&>svg]:text-primary",
        className,
      )}
    >
      <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
      <AlertTitle>Prospection téléphonique en France</AlertTitle>
      <AlertDescription>
        <div className="space-y-1.5 whitespace-normal break-words [overflow-wrap:anywhere] text-muted-foreground">
          <div>
            En France, pour la prospection téléphonique auprès des particuliers, retenez en pratique
            du lundi au vendredi, de 10 heures à 13 heures et de 14 heures à 20 heures (heure locale
            du contact), hors dimanche et jours fériés — vérifiez selon votre cible (B2C / B2B) et
            le cadre légal en vigueur.
          </div>
          <div>
            Ce CRM enregistre les périodes à la journée : les heures d’appel restent à respecter
            dans vos outils et processus terrain.
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
