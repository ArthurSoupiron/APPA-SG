import type { RegistreDto, RegistreType, TraitementDataDto } from "../../_lib/si-registres-types";
import { formatRegistreCreator } from "./registres-display-helpers";

export type RegistreSortColumn =
  | "anneeCivile"
  | "nom"
  | "dateFacturation"
  | "utilisationCommerciale"
  | "licenceCommercialeUrl"
  | "traitementDataNom"
  | "sheetExcelUrl"
  | "creator"
  | "driveFolderUrl";

export type TraitementSortColumn =
  | "reference"
  | "nomTraitement"
  | "creator"
  | "driveFolderUrl"
  | "fichePdfUrl"
  | "preuveConsentementUrl"
  | "preuveMentionsUrl";

export function getRegistreSortValue(
  row: RegistreDto,
  column: RegistreSortColumn,
): string | number | boolean | null {
  switch (column) {
    case "anneeCivile":
      return row.anneeCivile;
    case "nom":
      return row.nom;
    case "dateFacturation":
      return row.type === "licences" ? row.dateFacturation : null;
    case "utilisationCommerciale":
      return row.type === "licences" ? row.utilisationCommerciale : null;
    case "licenceCommercialeUrl":
      return row.type === "licences" ? row.licenceCommercialeUrl : null;
    case "traitementDataNom":
      return row.type === "bdd" ? row.traitementDataNom : null;
    case "sheetExcelUrl":
      return row.type === "bdd" ? row.sheetExcelUrl : null;
    case "creator":
      return formatRegistreCreator(row.user);
    case "driveFolderUrl":
      return row.driveFolderUrl;
    default:
      return null;
  }
}

export function getTraitementSortValue(
  row: TraitementDataDto,
  column: TraitementSortColumn,
): string | number | boolean | null {
  switch (column) {
    case "reference":
      return row.reference;
    case "nomTraitement":
      return row.nomTraitement;
    case "creator":
      return formatRegistreCreator(row.user);
    case "driveFolderUrl":
      return row.driveFolderUrl;
    case "fichePdfUrl":
      return row.fichePdfUrl;
    case "preuveConsentementUrl":
      return row.preuveConsentementUrl;
    case "preuveMentionsUrl":
      return row.preuveMentionsUrl;
    default:
      return null;
  }
}

export function registreColumnsForType(type: RegistreType): RegistreSortColumn[] {
  if (type === "licences") {
    return [
      "anneeCivile",
      "nom",
      "dateFacturation",
      "utilisationCommerciale",
      "licenceCommercialeUrl",
      "creator",
      "driveFolderUrl",
    ];
  }
  if (type === "bdd") {
    return ["anneeCivile", "nom", "traitementDataNom", "sheetExcelUrl", "creator", "driveFolderUrl"];
  }
  return ["anneeCivile", "nom", "creator", "driveFolderUrl"];
}

export const REGISTRE_COLUMN_LABELS: Record<RegistreSortColumn, string> = {
  anneeCivile: "Année",
  nom: "Nom",
  dateFacturation: "Date de facturation",
  utilisationCommerciale: "Commercial",
  licenceCommercialeUrl: "URL licence commerciale",
  traitementDataNom: "Traitement",
  sheetExcelUrl: "Google Sheet",
  creator: "Créé par",
  driveFolderUrl: "Dossier Drive",
};

export const TRAITEMENT_COLUMN_LABELS: Record<TraitementSortColumn, string> = {
  reference: "Réf.",
  nomTraitement: "Nom",
  creator: "Créé par",
  driveFolderUrl: "Dossier Drive",
  fichePdfUrl: "Fiche PDF",
  preuveConsentementUrl: "Preuve consentement",
  preuveMentionsUrl: "Preuve mentions",
};
