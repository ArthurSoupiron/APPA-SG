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

const DEADLINES: Deadline[] = [];

const CONFORMITE: ConformiteCheck[] = [];

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
