import type { Metadata } from "next";

import { SgJournal } from "../_components/sg-journal";

export const metadata: Metadata = { title: "Journal — SG" };

export default function SgJournalPage() {
  return <SgJournal />;
}
