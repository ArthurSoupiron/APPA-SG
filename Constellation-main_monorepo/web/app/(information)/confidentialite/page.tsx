import type { Metadata } from "next";
import { DocumentFromBlocks } from "@/components/information/document-from-blocks";
import { confidentialiteBlocks } from "@/lib/information/confidentialite";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Constellation collecte, utilise et protège vos données personnelles, et vos droits RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <article>
      <DocumentFromBlocks blocks={confidentialiteBlocks} />
    </article>
  );
}
