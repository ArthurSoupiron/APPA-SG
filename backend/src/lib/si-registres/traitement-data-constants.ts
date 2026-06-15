/** Modèle fiche traitement de données (KiwiX). */
export const DEFAULT_TRAITEMENT_DATA_TEMPLATE_URL =
  "https://kiwix.junior-entreprises.com/document/document/37669";

export const TRAITEMENT_TEMPLATE_DRIVE_FILENAME = "00_Modele_Fiche_RGPD.pdf";

export function getTraitementDataTemplateUrl(): string {
  return (
    process.env.TRAITEMENT_DATA_TEMPLATE_URL?.trim() || DEFAULT_TRAITEMENT_DATA_TEMPLATE_URL
  );
}
