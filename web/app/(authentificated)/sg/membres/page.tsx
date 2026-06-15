import type { Metadata } from "next";

import { SgMembers } from "../_components/sg-members";

export const metadata: Metadata = {
  title: "Membres — SG",
};

export default function SgMembresPage() {
  return <SgMembers />;
}
