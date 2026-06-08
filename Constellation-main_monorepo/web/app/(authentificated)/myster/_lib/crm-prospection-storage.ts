import type { CrmSectionId } from "@myster/_components/crm-sections";
import { isCrmSectionId } from "@myster/_components/crm-sections";

const KEY_SECTION = "crm_prospection_section";
const KEY_SPRINT = "crm_prospection_sprint_id";
const KEY_NEW = "crm_prospection_new_sprint";

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function readCrmProspectionSection(): CrmSectionId | null {
  const s = store()?.getItem(KEY_SECTION);
  if (!s || !isCrmSectionId(s)) return null;
  return s;
}

export function writeCrmProspectionSection(id: CrmSectionId): void {
  store()?.setItem(KEY_SECTION, id);
}

export function readCrmProspectionSprintId(): string | null {
  const v = store()?.getItem(KEY_SPRINT)?.trim();
  if (!v) return null;
  return v;
}

export function writeCrmProspectionSprintId(id: string | null): void {
  const st = store();
  if (!st) return;
  if (!id) st.removeItem(KEY_SPRINT);
  else st.setItem(KEY_SPRINT, id);
}

export function readCrmProspectionNewSprint(): boolean {
  return store()?.getItem(KEY_NEW) === "1";
}

export function writeCrmProspectionNewSprint(open: boolean): void {
  const st = store();
  if (!st) return;
  if (open) st.setItem(KEY_NEW, "1");
  else st.removeItem(KEY_NEW);
}

/** Liens profonds /myster/sprints/[id] : ouvre le détail dans le hub. */
export function persistCrmSprintDetailIntent(sprintId: string): void {
  writeCrmProspectionSection("sprints");
  writeCrmProspectionSprintId(sprintId);
  writeCrmProspectionNewSprint(false);
}

/** Lien /myster/sprints/new */
export function persistCrmNewSprintIntent(): void {
  writeCrmProspectionSection("sprints");
  writeCrmProspectionSprintId(null);
  writeCrmProspectionNewSprint(true);
}

/** Redirections /myster/contacts, /myster/kpi, etc. */
export function writeCrmProspectionSectionForRedirect(section: CrmSectionId): void {
  writeCrmProspectionSection(section);
}
