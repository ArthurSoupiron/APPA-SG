/**
 * Textes du hero + métrique Pretext (titre responsive).
 */
import { FONT_STACK, type PretextMetric } from "@/lib/pretext-presets";

export const landingHeroCopy = {
  title: "Votre espace de travail, unifié.",
} as const;

export const landingTitleMetric: PretextMetric = {
  fontDefault: `600 20px ${FONT_STACK}`,
  fontSmUp: `600 24px ${FONT_STACK}`,
  lineHeightDefault: 28,
  lineHeightSmUp: 32,
};
