"use client";

import { useParams } from "next/navigation";

import { SgDossier } from "../../_components/sg-dossier";

export default function SgDossierPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <SgDossier memberId={id} />;
}
