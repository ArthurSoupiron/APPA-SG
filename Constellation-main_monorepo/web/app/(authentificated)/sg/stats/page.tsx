import type { Metadata } from "next";

import { SgStats } from "../_components/sg-stats";

export const metadata: Metadata = { title: "Statistiques — SG" };

export default function SgStatsPage() {
  return <SgStats />;
}
