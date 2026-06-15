import type {
  CreateCommercialClientInput,
  CreateCommercialEntrepriseInput,
} from "../../types/missions";

export const MISSION_INFOS_TXT_CANONICAL_NAME = "infos_mission.txt";
export const MISSION_INFOS_TXT_MAX_BYTES = 32 * 1024;

export type ParsedMissionCommercialInfos = {
  client: CreateCommercialClientInput;
  entreprise: CreateCommercialEntrepriseInput;
};

export type ParseMissionInfosOk = {
  ok: true;
  data: ParsedMissionCommercialInfos;
  warnings: string[];
};

export type ParseMissionInfosInvalid = {
  ok: false;
  kind: "invalid";
  error: string;
  warnings: string[];
};

export type ParseMissionInfosResult = ParseMissionInfosOk | ParseMissionInfosInvalid;

type Section = "client" | "entreprise" | null;

const CLIENT_KEY_ALIASES: Record<string, keyof CreateCommercialClientInput> = {
  nom: "nomClient",
  nom_client: "nomClient",
  prenom: "prenomClient",
  prénom: "prenomClient",
  prenom_client: "prenomClient",
  prénom_client: "prenomClient",
  telephone: "telephoneClient",
  téléphone: "telephoneClient",
  tel: "telephoneClient",
  telephone_client: "telephoneClient",
  mail: "mailClient",
  email: "mailClient",
  mail_client: "mailClient",
  email_client: "mailClient",
};

const ENTREPRISE_KEY_ALIASES: Record<string, keyof CreateCommercialEntrepriseInput> = {
  nom: "nomEntreprise",
  nom_entreprise: "nomEntreprise",
  "nom entreprise": "nomEntreprise",
  siren: "sirenEntreprise",
  siren_entreprise: "sirenEntreprise",
  mail: "mailEntreprise",
  email: "mailEntreprise",
  mail_entreprise: "mailEntreprise",
  email_entreprise: "mailEntreprise",
  telephone: "telephoneEntreprise",
  téléphone: "telephoneEntreprise",
  tel: "telephoneEntreprise",
  telephone_entreprise: "telephoneEntreprise",
  adresse: "adresseEntreprise",
  adresse_entreprise: "adresseEntreprise",
  ville: "villeEntreprise",
  ville_entreprise: "villeEntreprise",
  code_postal: "codePostalEntreprise",
  "code postal": "codePostalEntreprise",
  cp: "codePostalEntreprise",
  code_postal_entreprise: "codePostalEntreprise",
  pays: "paysEntreprise",
  pays_entreprise: "paysEntreprise",
};

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function parseSectionHeader(line: string): Section | null {
  const match = line.match(/^\[(client|entreprise)\]\s*$/i);
  if (!match) return null;
  return match[1]!.toLowerCase() as Section;
}

function splitKeyValue(line: string): { key: string; value: string } | null {
  const colonIndex = line.indexOf(":");
  if (colonIndex <= 0) return null;
  const key = line.slice(0, colonIndex).trim();
  const value = line.slice(colonIndex + 1).trim();
  if (!key) return null;
  return { key, value };
}

function mapClientField(key: string): keyof CreateCommercialClientInput | null {
  return CLIENT_KEY_ALIASES[normalizeKey(key)] ?? null;
}

function mapEntrepriseField(key: string): keyof CreateCommercialEntrepriseInput | null {
  return ENTREPRISE_KEY_ALIASES[normalizeKey(key)] ?? null;
}

export function parseMissionInfosTxt(text: string): ParseMissionInfosResult {
  const warnings: string[] = [];
  let section: Section = null;
  const client: Partial<CreateCommercialClientInput> = {};
  const entreprise: Partial<CreateCommercialEntrepriseInput> = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const header = parseSectionHeader(line);
    if (header) {
      section = header;
      continue;
    }

    const kv = splitKeyValue(line);
    if (!kv) {
      warnings.push(`Ligne ignorée (format clé: valeur attendu) : ${line}`);
      continue;
    }

    if (!section) {
      warnings.push(`Clé hors section ignorée : ${kv.key}`);
      continue;
    }

    if (section === "client") {
      const field = mapClientField(kv.key);
      if (!field) {
        warnings.push(`Clé client inconnue ignorée : ${kv.key}`);
        continue;
      }
      client[field] = kv.value;
      continue;
    }

    const field = mapEntrepriseField(kv.key);
    if (!field) {
      warnings.push(`Clé entreprise inconnue ignorée : ${kv.key}`);
      continue;
    }
    entreprise[field] = kv.value;
  }

  const nomClient = client.nomClient?.trim() ?? "";
  const nomEntreprise = entreprise.nomEntreprise?.trim() ?? "";

  if (!nomClient && !nomEntreprise) {
    return {
      ok: false,
      kind: "invalid",
      error: "Sections [CLIENT] et [ENTREPRISE] manquantes ou sans nom obligatoire.",
      warnings,
    };
  }
  if (!nomClient) {
    return {
      ok: false,
      kind: "invalid",
      error: "Nom client manquant (section [CLIENT], clé nom).",
      warnings,
    };
  }
  if (!nomEntreprise) {
    return {
      ok: false,
      kind: "invalid",
      error: "Nom entreprise manquant (section [ENTREPRISE], clé nom).",
      warnings,
    };
  }

  return {
    ok: true,
    data: {
      client: {
        nomClient,
        prenomClient: client.prenomClient?.trim() ?? "",
        telephoneClient: client.telephoneClient?.trim() ?? "",
        mailClient: client.mailClient?.trim() ?? "",
      },
      entreprise: {
        nomEntreprise,
        sirenEntreprise: entreprise.sirenEntreprise?.trim() ?? "",
        mailEntreprise: entreprise.mailEntreprise?.trim() ?? "",
        telephoneEntreprise: entreprise.telephoneEntreprise?.trim() ?? "",
        adresseEntreprise: entreprise.adresseEntreprise?.trim() ?? "",
        villeEntreprise: entreprise.villeEntreprise?.trim() ?? "",
        codePostalEntreprise: entreprise.codePostalEntreprise?.trim() ?? "",
        paysEntreprise: entreprise.paysEntreprise?.trim() || "France",
      },
    },
    warnings,
  };
}
