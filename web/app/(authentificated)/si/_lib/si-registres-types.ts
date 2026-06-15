export type RegistreType = "rgpd" | "licences" | "bdd";

export type RegistreUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type RegistreBase = {
  id: string;
  userId: string;
  anneeCivile: number;
  nom: string;
  driveFolderUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: RegistreUser;
};

export type RegistreRgpdDto = RegistreBase & { type: "rgpd" };

export type RegistreLicencesDto = RegistreBase & {
  type: "licences";
  dateFacturation: string | null;
  utilisationCommerciale: boolean;
  licenceCommercialeUrl: string | null;
};

export type RegistreBddDto = RegistreBase & {
  type: "bdd";
  traitementDataId: string | null;
  sheetExcelUrl: string | null;
  traitementDataNom: string | null;
};

export type RegistreDto = RegistreRgpdDto | RegistreLicencesDto | RegistreBddDto;

export type TraitementDataDto = {
  id: string;
  userId: string;
  nomTraitement: string;
  reference: string;
  descriptionFinalite: string | null;
  dateCreationFiche: string | null;
  dateMiseAJourFiche: string | null;
  driveFolderUrl: string | null;
  fichePdfUrl: string | null;
  preuveConsentementUrl: string | null;
  preuveMentionsUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: RegistreUser;
};

export type SiRegistresInitialData = {
  registres: RegistreDto[];
  traitements: TraitementDataDto[];
  driveConfigured: boolean;
  traitementDataTemplateUrl: string;
};

export type DriveScanReport = {
  created: number;
  skipped: number;
  errors: string[];
};

export type SheetPermissionEntry = {
  id: string;
  type: string;
  role: string;
  emailAddress: string | null;
  displayName: string | null;
};

export type ConformitySectionId =
  | "registre-licences"
  | "registre-rgpd"
  | "registre-bdd"
  | "registre-traitement-data"
  | "droit-acces"
  | "droit-rectification"
  | "droit-effacement"
  | "droit-opposition"
  | "droit-portabilite";
