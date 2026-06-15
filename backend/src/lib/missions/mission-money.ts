export function getDesignationTotalHtStr(designation: {
  prixTotalHt?: string | null;
  nbJeh?: number | null;
  montantJeh?: string | null;
}): string | null {
  const explicit = designation.prixTotalHt?.trim();
  if (explicit) return explicit;
  const nbJeh = designation.nbJeh ?? 0;
  const montantJeh = Number(designation.montantJeh ?? 0);
  if (nbJeh > 0 && Number.isFinite(montantJeh)) {
    return String(nbJeh * montantJeh);
  }
  return null;
}
