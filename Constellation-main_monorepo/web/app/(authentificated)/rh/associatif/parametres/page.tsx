import type { Metadata } from "next";

import { SgParametres } from "../_components/sg-parametres";

export const metadata: Metadata = { title: "Paramètres — SG" };

export default function SgParametresPage() {
  return <SgParametres />;
}
