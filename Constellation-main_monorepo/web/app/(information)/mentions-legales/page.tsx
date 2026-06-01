import type { Metadata } from "next";
import { DocumentFromBlocks } from "@/components/information/document-from-blocks";
import { mentionsLegalesBlocks } from "@/lib/information/mentions-legales";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Informations légales relatives à l'éditeur, l'hébergement et la propriété intellectuelle du service Constellation.",
};

export default function MentionsLegalesPage() {
  return (
    <article>
      <DocumentFromBlocks blocks={mentionsLegalesBlocks} />
    </article>
  );
}
