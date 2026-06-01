"use client";

import { useParams } from "next/navigation";

import { SgDossier } from "../../../(authentificated)/rh/associatif/_components/sg-dossier";

export default function SgDemoDossierPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <SgDossier memberId={id} />;
}
