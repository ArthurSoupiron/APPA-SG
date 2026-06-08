import type { CSSProperties } from "react";

/**
 * Recharts : utiliser les couleurs CSS du thème (`--chart-*` dans `app/globals.css`)
 * telles quelles — ne pas les envelopper dans `hsl(...)`.
 */
export const CRM_CHART_HEX = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const CRM_AREA_MAIN = "var(--chart-2)";

export const chartAxisTick = { fill: "var(--muted-foreground)", fontSize: 11 } as const;

export const chartGridStroke = "color-mix(in oklch, var(--border) 55%, transparent)";

export function crmChartTooltipStyle(): CSSProperties {
  return {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--card-foreground)",
    fontSize: 12,
  };
}
