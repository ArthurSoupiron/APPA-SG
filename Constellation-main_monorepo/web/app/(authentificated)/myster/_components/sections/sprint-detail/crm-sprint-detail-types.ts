export type Member = { userId: string; name: string; email: string; joinedAt: string };
export type SpRow = {
  prospectId: string;
  assignedUserId: string | null;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  entreprise: string | null;
  secteur: string | null;
  source: string | null;
  statut: string;
  linkedin: string | null;
  notes: string | null;
  updatedAt?: string;
};

export type FicheFormState = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  linkedin: string;
  entreprise: string;
  secteur: string;
  source: string;
  notes: string;
  statut: string;
};

export function emptyFicheForm(): FicheFormState {
  return {
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    linkedin: "",
    entreprise: "",
    secteur: "",
    source: "",
    notes: "",
    statut: "a_contacter",
  };
}

export type UserOpt = { id: string; name: string; email: string };
export type ProspectOpt = {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  secteur?: string | null;
  statut?: string | null;
};
