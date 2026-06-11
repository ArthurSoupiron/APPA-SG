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
  { id: "ba", label: "Bulletins d'adhésion", count: 84 },
  { id: "cr", label: "Comptes rendus (CR)", count: 142 },
  { id: "pvag", label: "PV d'Assemblée Générale", count: 31 },
  { id: "ri", label: "Règlement intérieur", count: 7 },
  { id: "statuts", label: "Statuts", count: 5 },
  { id: "pref", label: "Préfecture", count: 23 },
  { id: "compta", label: "Comptabilité", count: 64 },
  { id: "contrats", label: "Contrats & conventions", count: 130 },
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

const DOCS: GedDoc[] = [
  { id: "g1", title: "PV d'AG Extraordinaire — Modification des statuts", cat: "pvag", pages: 6, format: "PDF", size: "412 Ko", mandat: "25–26", ref: "PV-AG-2026-002", status: "signed", author: "lb", signers: ["hm", "lb", "cr", "pd", "yb"], date: "28 avr 2026", dateAbs: "2026-04-28", tags: ["statuts", "vote", "CNJE"], security: "Confidentiel" },
  { id: "g2", title: "Statuts JEECE — version consolidée 2026", cat: "statuts", pages: 18, format: "PDF", size: "982 Ko", mandat: "25–26", ref: "STAT-2026-V4", status: "signed", author: "lb", signers: ["hm", "lb"], date: "30 avr 2026", dateAbs: "2026-04-30", tags: ["statuts", "CNJE"], security: "Public" },
  { id: "g3", title: "Règlement intérieur v.4", cat: "ri", pages: 12, format: "DOCX", size: "142 Ko", mandat: "25–26", ref: "RI-2026-V4-WIP", status: "pending", author: "pd", signers: [], date: "8 mai 2026", dateAbs: "2026-05-08", tags: ["RI", "brouillon"], security: "Interne" },
  { id: "g4", title: "CR Bureau — 5 mai 2026", cat: "cr", pages: 4, format: "PDF", size: "198 Ko", mandat: "25–26", ref: "CR-BUR-2026-018", status: "pending", author: "lb", signers: ["lb"], date: "5 mai 2026", dateAbs: "2026-05-05", tags: ["bureau"], security: "Interne" },
  { id: "g5", title: "Bulletin d'adhésion — M. Nguyen", cat: "ba", pages: 2, format: "PDF", size: "96 Ko", mandat: "25–26", ref: "BA-2026-084", status: "pending", author: "sh", signers: [], date: "6 mai 2026", dateAbs: "2026-05-06", tags: ["adhésion", "postulant"], security: "Confidentiel" },
  { id: "g6", title: "Déclaration changement de bureau — Cerfa 13971", cat: "pref", pages: 3, format: "PDF", size: "120 Ko", mandat: "25–26", ref: "PREF-2025-014", status: "signed", author: "lb", signers: ["hm", "lb"], date: "20 sept 2025", dateAbs: "2025-09-20", tags: ["Préfecture", "Cerfa"], security: "Public" },
  { id: "g7", title: "PV d'AG Élective — Bureau 2025–2026", cat: "pvag", pages: 7, format: "PDF", size: "388 Ko", mandat: "25–26", ref: "PV-AG-2025-003", status: "signed", author: "hm", signers: ["hm", "lb"], date: "12 sept 2025", dateAbs: "2025-09-12", tags: ["élection", "bureau"], security: "Public" },
  { id: "g8", title: "Comptes annuels 2024 — liasse complète", cat: "compta", pages: 22, format: "PDF", size: "1.4 Mo", mandat: "24–25", ref: "COMPTA-2024", status: "archived", author: "cr", signers: ["cr", "hm", "jv"], date: "12 juin 2025", dateAbs: "2025-06-12", tags: ["comptes", "JOAFE"], security: "Confidentiel" },
  { id: "g9", title: "Convention de stage — Pernod Ricard", cat: "contrats", pages: 6, format: "PDF", size: "310 Ko", mandat: "25–26", ref: "CONV-2026-041", status: "signed", author: "jm", signers: ["hm", "jm"], date: "12 avr 2026", dateAbs: "2026-04-12", tags: ["stage", "client"], security: "Confidentiel" },
  { id: "g10", title: "CR Bureau — 28 avril 2026", cat: "cr", pages: 5, format: "PDF", size: "222 Ko", mandat: "25–26", ref: "CR-BUR-2026-017", status: "signed", author: "lb", signers: ["hm", "lb"], date: "28 avr 2026", dateAbs: "2026-04-28", tags: ["bureau"], security: "Interne" },
  { id: "g11", title: "PV d'AG Ordinaire 2024–2025 — Approbation comptes", cat: "pvag", pages: 9, format: "PDF", size: "624 Ko", mandat: "24–25", ref: "PV-AG-2025-001", status: "signed", author: "jv", signers: ["jv", "lb", "cr"], date: "14 juin 2025", dateAbs: "2025-06-14", tags: ["comptes", "vote"], security: "Public" },
  { id: "g12", title: "Attestation RC Allianz — contrat FR-208441", cat: "contrats", pages: 2, format: "PDF", size: "88 Ko", mandat: "25–26", ref: "ASSU-2025-002", status: "signed", author: "lb", signers: ["lb"], date: "23 août 2025", dateAbs: "2025-08-23", tags: ["RC", "Allianz"], security: "Interne" },
];

const ACTIVITY: Activity[] = [
  { who: "hm", action: "a généré", target: "Attestation de fonction · A. Diop", ctx: "modèle attestation-fonction-v3", when: "il y a 12 min", icon: "file-plus", tone: "brand" },
  { who: "pd", action: "a déposé", target: "CR Bureau — 5 mai 2026.pdf", ctx: "catégorie Comptes rendus", when: "il y a 1 h", icon: "upload", tone: "info" },
  { who: "sh", action: "a complété le dossier de", target: "Marion Nguyen", ctx: "bulletin d'adhésion ajouté", when: "il y a 3 h", icon: "folder-check", tone: "brand" },
  { who: "lb", action: "a signé", target: "PV d'AG Extraordinaire", ctx: "signature numérique · DocuSign", when: "hier 18:42", icon: "pen-tool", tone: "violet" },
  { who: "cr", action: "a archivé", target: "Comptes annuels 2024", ctx: "dépôt JOAFE confirmé", when: "hier 16:10", icon: "archive", tone: "neutral" },
];

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
