export const DOC_TYPES_WITH_TEMPLATE = [
  "CCA",
  "BC",
  "BCR",
  "RMI",
  "ARMI",
  "PVRF",
] as const;

export type DocTypeWithTemplate = (typeof DOC_TYPES_WITH_TEMPLATE)[number];

export function getTemplateFileName(documentType: string): string {
  switch (documentType) {
    case "CCA":
      return "template_cca.docx";
    case "BC":
      return "template_bc.docx";
    case "BCR":
      return "template_bcr.docx";
    case "RMI":
      return "template_rmi.docx";
    case "ARMI":
      return "template_armi.docx";
    case "PVRF":
      return "template_pvrf.docx";
    default:
      return "";
  }
}

export function hasTemplateForDocType(documentType: string): boolean {
  return DOC_TYPES_WITH_TEMPLATE.includes(documentType as DocTypeWithTemplate);
}

export function inferDocTypeFromTemplateFileName(
  fileName: string,
): DocTypeWithTemplate | null {
  const n = fileName.trim().toLowerCase();
  for (const dt of DOC_TYPES_WITH_TEMPLATE) {
    const expected = getTemplateFileName(dt);
    if (!expected) continue;
    const expectedLower = expected.toLowerCase();
    const baseLower = expectedLower.replace(/\.docx$/i, "");
    if (n === expectedLower || n === baseLower || n === `${baseLower}.docx`) return dt;
  }
  return null;
}
