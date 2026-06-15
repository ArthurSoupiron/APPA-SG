import type { CrmApolloProspectFieldKey } from "@myster/_lib/crm-apollo-prospect-fields";

export type Prospect = {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  linkedin: string | null;
  entreprise: string | null;
  secteur: string | null;
  source: string | null;
  statut: string;
  notes: string | null;
} & Partial<Record<CrmApolloProspectFieldKey, string | null>>;

export type ProspectTimelineEntry =
  | {
      id: string;
      at: string;
      type: "status_change";
      userId: string | null;
      userName: string | null;
      oldStatus: string | null;
      newStatus: string;
    }
  | {
      id: string;
      at: string;
      type: "note";
      userId: string | null;
      userName: string | null;
      body: string;
    }
  | {
      id: string;
      at: string;
      type: "contact_event";
      userId: string | null;
      userName: string | null;
      kind: string;
      metadata: Record<string, unknown> | null;
    }
  | {
      id: string;
      at: string;
      type: "audit";
      userId: string | null;
      userName: string | null;
      action: string;
      payload: Record<string, unknown> | null;
    };

export function formatTimelineAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function emptyForm(): Partial<Prospect> {
  return {
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    linkedin: "",
    entreprise: "",
    secteur: "",
    source: "",
    statut: "a_contacter",
    notes: "",
  };
}
