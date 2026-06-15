import type { Metadata } from "next";

import { SgDocuments } from "../_components/sg-documents";

export const metadata: Metadata = { title: "Documents — SG" };

export default function SgDocumentsPage() {
  return <SgDocuments />;
}
