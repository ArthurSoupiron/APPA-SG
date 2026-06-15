import type { Metadata } from "next";
import { DocumentFromBlocks } from "@/components/information/document-from-blocks";
import { cguBlocks } from "@/lib/information/cgu";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Conditions d'accès et d'utilisation du service Constellation : droits, obligations et responsabilités des utilisateurs.",
};

export default function CguPage() {
  return (
    <article>
      <DocumentFromBlocks blocks={cguBlocks} />
    </article>
  );
}
