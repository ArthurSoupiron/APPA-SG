// Module SG — utilitaires front (téléchargement, CSV)
import type { GedDoc, Member, SgData } from "./sg-types";
import { STATUS_LABEL } from "./sg-types";
import { dossierStats } from "./sg-store";

export function downloadBlob(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCSV(rows: (string | number)[][]): string {
  return (
    "﻿" +
    rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? "");
            return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(";"),
      )
      .join("\r\n")
  );
}

export function exportMembersCSV(data: SgData) {
  const header = ["Prénom", "Nom", "Email", "Téléphone", "Pôle", "Rôle", "Année", "Promo", "Statut", "Ville", "Complétude %"];
  const rows = data.members.map((m: Member) => [
    m.first, m.last, m.email, m.phone, m.pole, m.role, m.year, m.promo,
    STATUS_LABEL[m.status].k, m.city, dossierStats(data, m).pct,
  ]);
  downloadBlob("membres-jeece-sg.csv", toCSV([header, ...rows]), "text/csv;charset=utf-8");
}

export function exportDocsCSV(data: SgData) {
  const header = ["Titre", "Référence", "Catégorie", "Format", "Pages", "Statut", "Confidentialité", "Date", "Tags"];
  const rows = data.docs.map((d: GedDoc) => [
    d.title, d.ref, data.gedCats.find((c) => c.id === d.cat)?.label ?? d.cat,
    d.format, d.pages, d.status, d.security, d.date, d.tags.join(", "),
  ]);
  downloadBlob("documents-jeece-sg.csv", toCSV([header, ...rows]), "text/csv;charset=utf-8");
}
