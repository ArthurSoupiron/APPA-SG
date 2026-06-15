import type { Metadata } from "next";

import { UiAllShowcase } from "@/components/dev/ui-all-showcase";

export const metadata: Metadata = {
  title: "UI — galerie components/ui",
  description: "Aperçu des composants shadcn du dossier components/ui",
};

export default function UiAllPage() {
  return <UiAllShowcase />;
}
