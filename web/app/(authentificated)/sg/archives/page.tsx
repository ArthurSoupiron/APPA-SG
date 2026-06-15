import type { Metadata } from "next";

import { SgArchives } from "../_components/sg-archives";

export const metadata: Metadata = { title: "Archives — SG" };

export default function SgArchivesPage() {
  return <SgArchives />;
}
