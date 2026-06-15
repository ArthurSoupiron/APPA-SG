export function formatMoney(value: string | number | null | undefined): string {
  if (value == null || value === "") return "-";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatJeh(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getDesignationTotalHt(d: {
  prixTotalHt?: string | null;
  nbJeh: number | null;
  montantJeh: string | null;
}): number {
  const explicit = Number(d.prixTotalHt ?? "");
  if (!Number.isNaN(explicit) && explicit > 0) return explicit;
  const nbJeh = d.nbJeh ?? 0;
  const montantJeh = Number(d.montantJeh ?? 0);
  if (Number.isNaN(montantJeh) || nbJeh <= 0) return 0;
  return nbJeh * montantJeh;
}
