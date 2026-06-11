// Module SG — jeu de données de démonstration (mock)
import type {
  Activity,
  ConformiteCheck,
  Deadline,
  DocType,
  GedCat,
  GedDoc,
  Member,
  SgData,
} from "./sg-types";

const DOC_TYPES: DocType[] = [
  { code: "BA", label: "Bulletin d'adhésion", required: true },
  { code: "CHARTE", label: "Charte du membre", required: true },
  { code: "CE", label: "Carte étudiante", required: true },
  { code: "RIB", label: "RIB", required: true },
  { code: "RC", label: "Attestation RC", required: true },
  { code: "CV", label: "CV à jour", required: false },
];

const GED_CATS: GedCat[] = [
  { id: "ba", label: "Bulletins d'adhésion", count: 0 },
  { id: "cr", label: "Comptes rendus (CR)", count: 0 },
  { id: "pvag", label: "PV d'Assemblée Générale", count: 0 },
  { id: "ri", label: "Règlement intérieur", count: 0 },
  { id: "statuts", label: "Statuts", count: 0 },
  { id: "pref", label: "Préfecture", count: 0 },
  { id: "compta", label: "Comptabilité", count: 0 },
  { id: "contrats", label: "Contrats & conventions", count: 0 },
];

const MEMBERS: Member[] = [];

const DEADLINES: Deadline[] = [
  { id: "d1", date: "2026-06-14", title: "Assemblée Générale ordinaire 2026", sub: "Convocation à diffuser avant le 31 mai", kind: "AG" },
  { id: "d2", date: "2026-06-22", title: "Renouvellement assurance RC", sub: "Allianz · contrat FR-208441", kind: "Assurance" },
  { id: "d3", date: "2026-06-30", title: "Dépôt des comptes annuels 2025", sub: "JOAFE · obligation légale", kind: "Compta" },
  { id: "d4", date: "2026-07-15", title: "Passation de mandat 2025–2026", sub: "14 membres sortants · archivage dossiers", kind: "Mandat" },
  { id: "d5", date: "2026-08-02", title: "Déclaration nouveaux statuts", sub: "Préfecture du 75 · suite vote AG", kind: "Préfecture" },
];

const CONFORMITE: ConformiteCheck[] = [
  { id: "c1", k: "Statuts à jour & déposés", s: "Version consolidée 2026 · Préfecture", state: "ok", ref: "STAT-2026-V4" },
  { id: "c2", k: "PV de la dernière AG signé", s: "AG Extraordinaire du 28 avril 2026", state: "ok", ref: "PV-AG-2026-002" },
  { id: "c3", k: "Règlement intérieur validé", s: "v.4 en attente de signature Présidence", state: "pending", ref: "RI-2026-V4" },
  { id: "c4", k: "Déclaration changement de bureau", s: "Cerfa 13971 déposé · 20 sept 2025", state: "ok", ref: "PREF-2025-014" },
  { id: "c5", k: "Assurance RC en cours de validité", s: "Allianz · renouvellement avant le 22 juin", state: "pending", ref: "ASSU-2025-002" },
  { id: "c6", k: "Comptes annuels 2025 déposés", s: "JOAFE · échéance 30 juin 2026", state: "todo", ref: "COMPTA-2025" },
];

const DOCS: GedDoc[] = [];

const ACTIVITY: Activity[] = [];

export function buildSeed(): SgData {
  // structuredClone évite que les mutations touchent les constantes de module
  return structuredClone({
    members: MEMBERS,
    docs: DOCS,
    deadlines: DEADLINES,
    conformite: CONFORMITE,
    docTypes: DOC_TYPES,
    gedCats: GED_CATS,
    activity: ACTIVITY,
  });
}
