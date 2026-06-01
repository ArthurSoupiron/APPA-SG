import type { Metadata } from "next";

import { SgDashboard } from "./_components/sg-dashboard";

export const metadata: Metadata = {
  title: "Gestion Associative (SG)",
};

export default function RhAssociatifPage() {
  return <SgDashboard />;
}
