/** Indicatif → format national (groupes de chiffres sans espaces dans le motif). */
type CallingCodeRule = {
  code: string;
  /** Longueurs nationales valides (sans indicatif). */
  nationalLengths: number[];
  /** Découpe affichage : ex. [1, 2, 2, 2, 2] pour FR mobile. */
  groups: number[];
  /** Numéro local sans indicatif (ex. 0612… → règle FR). */
  matchLocal?: (digits: string) => string | null;
};

const CALLING_CODE_RULES: CallingCodeRule[] = [
  {
    code: "352",
    nationalLengths: [8, 9],
    groups: [2, 2, 2, 2],
    matchLocal: (d) => (d.length === 9 && !d.startsWith("0") ? d : d.length === 10 && d.startsWith("0") ? d.slice(1) : null),
  },
  {
    code: "351",
    nationalLengths: [9],
    groups: [3, 3, 3],
    matchLocal: (d) => (d.length === 9 ? d : d.length === 10 && d.startsWith("0") ? d.slice(1) : null),
  },
  {
    code: "49",
    nationalLengths: [10, 11],
    groups: [3, 3, 4],
    matchLocal: (d) =>
      d.length >= 10 && d.length <= 12 && d.startsWith("0") ? d.replace(/^0+/, "") : null,
  },
  {
    code: "44",
    nationalLengths: [10],
    groups: [4, 3, 3],
    matchLocal: (d) => (d.length === 11 && d.startsWith("0") ? d.slice(1) : d.length === 10 ? d : null),
  },
  {
    code: "41",
    nationalLengths: [9],
    groups: [2, 3, 2, 2],
    matchLocal: (d) => (d.length === 10 && d.startsWith("0") ? d.slice(1) : d.length === 9 ? d : null),
  },
  {
    code: "39",
    nationalLengths: [9, 10],
    groups: [3, 3, 4],
    matchLocal: (d) => (d.length >= 9 && d.length <= 11 && d.startsWith("0") ? d.slice(1) : null),
  },
  {
    code: "34",
    nationalLengths: [9],
    groups: [3, 3, 3],
    matchLocal: (d) => (d.length === 9 ? d : d.length === 10 && d.startsWith("0") ? d.slice(1) : null),
  },
  {
    code: "33",
    nationalLengths: [9],
    groups: [1, 2, 2, 2, 2],
    matchLocal: (d) => {
      if (d.length === 10 && d.startsWith("0")) return d.slice(1);
      if (d.length === 9 && /^[1-79]/.test(d)) return d;
      return null;
    },
  },
  {
    code: "32",
    nationalLengths: [8, 9],
    groups: [3, 2, 2, 2],
    matchLocal: (d) => (d.length === 10 && d.startsWith("0") ? d.slice(1) : d.length === 9 ? d : null),
  },
  {
    code: "31",
    nationalLengths: [9],
    groups: [3, 3, 3],
    matchLocal: (d) => (d.length === 10 && d.startsWith("0") ? d.slice(1) : d.length === 9 ? d : null),
  },
  {
    code: "1",
    nationalLengths: [10],
    groups: [3, 3, 4],
    matchLocal: (d) => {
      if (d.length === 10) return d;
      if (d.length === 11 && d.startsWith("1")) return d.slice(1);
      return null;
    },
  },
];

/** Pays (libellé Apollo / CRM) → indicatif par défaut si le numéro est local. */
const COUNTRY_LABEL_TO_CALLING_CODE: Record<string, string> = {
  fr: "33",
  france: "33",
  french: "33",
  be: "32",
  belgique: "32",
  belgium: "32",
  ch: "41",
  suisse: "41",
  switzerland: "41",
  de: "49",
  allemagne: "49",
  germany: "49",
  es: "34",
  espagne: "34",
  spain: "34",
  it: "39",
  italie: "39",
  italy: "39",
  gb: "44",
  uk: "44",
  "united kingdom": "44",
  "royaume-uni": "44",
  england: "44",
  us: "1",
  usa: "1",
  "united states": "1",
  "états-unis": "1",
  ca: "1",
  canada: "1",
  nl: "31",
  netherlands: "31",
  "pays-bas": "31",
  pt: "351",
  portugal: "351",
  lu: "352",
  luxembourg: "352",
};

const RULES_BY_CODE = new Map(CALLING_CODE_RULES.map((r) => [r.code, r]));
const SORTED_CODES = [...CALLING_CODE_RULES].sort((a, b) => b.code.length - a.code.length);

export const PROSPECT_PHONE_FIELD_KEYS = [
  "telephone",
  "telephoneMobile",
  "telephoneCorporate",
  "telephoneDirect",
  "telephoneEntreprise",
] as const;

export type ProspectPhoneFieldKey = (typeof PROSPECT_PHONE_FIELD_KEYS)[number];

function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function callingCodeFromCountryLabel(label: string | undefined): string | undefined {
  if (!label?.trim()) return undefined;
  return COUNTRY_LABEL_TO_CALLING_CODE[normalizeLabel(label)];
}

function stripExtension(raw: string): string {
  return raw.replace(/\s*(?:ext\.?|x|#)\s*\d+\s*$/i, "").trim();
}

function extractDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function formatWithGroups(national: string, groups: number[]): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of groups) {
    if (i >= national.length) break;
    parts.push(national.slice(i, i + size));
    i += size;
  }
  while (i < national.length) {
    parts.push(national.slice(i, i + 2));
    i += 2;
  }
  return parts.filter(Boolean).join(" ");
}

function isValidNational(rule: CallingCodeRule, national: string): boolean {
  return rule.nationalLengths.includes(national.length);
}

function parseInternationalDigits(digits: string): { code: string; national: string } | null {
  for (const rule of SORTED_CODES) {
    if (!digits.startsWith(rule.code)) continue;
    const national = digits.slice(rule.code.length);
    if (isValidNational(rule, national)) return { code: rule.code, national };
  }
  return null;
}

function parseLocalDigits(digits: string, defaultCode: string): { code: string; national: string } | null {
  const rule = RULES_BY_CODE.get(defaultCode);
  if (!rule) return null;
  const national = rule.matchLocal?.(digits);
  if (!national || !isValidNational(rule, national)) return null;
  return { code: rule.code, national };
}

/**
 * Normalise vers `+<indicatif> <groupes 2–3 chiffres selon le pays>`.
 * Ex. `06 12 34 56 78` → `+33 6 12 34 56 78`, `(555) 123-4567` → `+1 555 123 4567`.
 */
export function normalizePhoneNumber(
  raw: string | undefined,
  defaultCallingCode = "33",
): string | undefined {
  const cleaned = stripExtension(raw ?? "");
  if (!cleaned || !/\d/.test(cleaned)) return undefined;

  let digits = extractDigits(cleaned);
  if (digits.length < 8) return undefined;

  const explicitIntl = cleaned.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);

  let parsed: { code: string; national: string } | null = null;
  if (explicitIntl || cleaned.startsWith("+")) {
    parsed = parseInternationalDigits(digits);
  } else {
    parsed = parseLocalDigits(digits, defaultCallingCode);
    if (!parsed && digits.length === 10 && !digits.startsWith("0")) {
      const usRule = RULES_BY_CODE.get("1");
      if (usRule?.nationalLengths.includes(10)) {
        parsed = { code: "1", national: digits };
      }
    }
    parsed ??= parseInternationalDigits(digits);
  }

  if (!parsed) return undefined;

  const rule = RULES_BY_CODE.get(parsed.code);
  if (!rule) return `+${parsed.code} ${formatWithGroups(parsed.national, [2, 2, 2, 2])}`;

  return `+${parsed.code} ${formatWithGroups(parsed.national, rule.groups)}`;
}

export function inferDefaultCallingCode(pays?: string, paysEntreprise?: string): string {
  return (
    callingCodeFromCountryLabel(pays) ??
    callingCodeFromCountryLabel(paysEntreprise) ??
    "33"
  );
}

export function normalizeProspectPhoneFields<T extends Record<string, unknown>>(fields: T): T {
  const defaultCode = inferDefaultCallingCode(
    typeof fields.pays === "string" ? fields.pays : undefined,
    typeof fields.paysEntreprise === "string" ? fields.paysEntreprise : undefined,
  );
  const out = { ...fields };
  for (const key of PROSPECT_PHONE_FIELD_KEYS) {
    const raw = out[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    (out as Record<string, string | undefined>)[key] = normalizePhoneNumber(raw, defaultCode);
  }
  return out;
}
