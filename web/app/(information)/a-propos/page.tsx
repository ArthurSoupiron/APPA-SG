import type { Metadata } from "next";
import { DocumentFromBlocks } from "@/components/information/document-from-blocks";
import { aProposBlocks } from "@/lib/information/a-propos";

export const metadata: Metadata = {
  title: "À propos",
  description: "Découvrez la mission, les valeurs et l'équipe derrière Constellation.",
};

export default function AProposPage() {
  return (
    <article>
      <DocumentFromBlocks blocks={aProposBlocks} />
    </article>
  );
}
