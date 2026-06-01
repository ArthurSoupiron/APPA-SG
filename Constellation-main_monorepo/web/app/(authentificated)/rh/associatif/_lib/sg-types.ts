// Module SG (Gestion Associative) — types partagés

export type DocCode = "BA" | "CHARTE" | "CE" | "RIB" | "RC" | "CV" | string;
export type DocState = "ok" | "pending" | "missing";

export type DocType = {
  code: DocCode;
  label: string;
  required: boolean;
};

export type MemberStatus = "active" | "pending" | "alumni" | "inactive";

export type Mandate = {
  role: string;
  period: string;
  current?: boolean;
};

export type Member = {
  id: string;
  first: string;
  last: string;
  initials: string;
  role: string;
  pole: string;
  promo: number;
  year: string;
  status: MemberStatus;
  email: string;
  phone: string;
  joined: string;
  city: string;
  address?: string;
  studentId?: string;
  jeeceId?: string;
  birth?: string;
  docs: Record<string, DocState>;
  mandates?: Mandate[];
};

export type GedCat = {
  id: string;
  label: string;
  count?: number;
};

export type DocStatus = "signed" | "pending" | "archived";

export type GedDoc = {
  id: string;
  title: string;
  cat: string;
  pages: number;
  format: string;
  size: string;
  mandat: string;
  ref: string;
  status: DocStatus;
  author: string;
  signers: string[];
  date: string;
  dateAbs: string;
  tags: string[];
  security: "Public" | "Interne" | "Confidentiel";
  fav?: boolean;
};

export type Deadline = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  sub: string;
  kind: string;
};

export type CheckState = "ok" | "pending" | "todo";
export type ConformiteCheck = {
  id: string;
  k: string;
  s: string;
  state: CheckState;
  ref: string | null;
};

export type Activity = {
  who: string;
  action: string;
  target: string;
  ctx: string;
  when: string;
  icon?: string;
  tone?: string;
};

export type SgData = {
  members: Member[];
  docs: GedDoc[];
  deadlines: Deadline[];
  conformite: ConformiteCheck[];
  docTypes: DocType[];
  gedCats: GedCat[];
  activity: Activity[];
};

export const STATUS_LABEL: Record<MemberStatus, { k: string; tone: "ok" | "warn" | "info" | "danger" }> = {
  active: { k: "Actif", tone: "ok" },
  pending: { k: "Postulant", tone: "warn" },
  alumni: { k: "Alumni", tone: "info" },
  inactive: { k: "Inactif", tone: "danger" },
};
