/**
 * Métriques Pretext réutilisables — alignées sur le thème Tailwind v4 (`theme.css`).
 * À utiliser avec `PretextBlock` (@/components/typography).
 */
export const FONT_STACK = "Geist, ui-sans-serif, system-ui, sans-serif";

export type PretextMetric = {
  fontDefault: string;
  fontSmUp: string;
  lineHeightDefault: number;
  lineHeightSmUp: number;
};

export function pretextFixed(weight: number, sizePx: number, lineHeightPx: number): PretextMetric {
  const f = `${weight} ${sizePx}px ${FONT_STACK}`;
  return {
    fontDefault: f,
    fontSmUp: f,
    lineHeightDefault: lineHeightPx,
    lineHeightSmUp: lineHeightPx,
  };
}

/** Hiérarchie courante (corps, légendes, erreurs). */
export const PRETEXT = {
  /** `text-xs` */
  xs: pretextFixed(400, 12, 16),
  /** `text-sm` */
  sm: pretextFixed(400, 14, 20),
  /** `text-sm` + `font-medium` */
  smMedium: pretextFixed(500, 14, 20),
  /** `text-base` */
  base: pretextFixed(400, 16, 24),
  /** `text-2xl` + `font-semibold` */
  h1Page: pretextFixed(600, 24, 32),
  /** Très petit (ex. compact OAuth ~10px, interligne serré) */
  micro: pretextFixed(400, 10, 12),
} as const;
