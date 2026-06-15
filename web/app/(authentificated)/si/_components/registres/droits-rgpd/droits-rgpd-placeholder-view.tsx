import type { ConformitySectionId } from "../../../_lib/si-registres-types";

const CONTENT: Record<
  Exclude<ConformitySectionId, "registre-licences" | "registre-rgpd" | "registre-bdd" | "registre-traitement-data">,
  { title: string; description: string; processus: string }
> = {
  "droit-acces": {
    title: "Droit d'accès",
    description:
      "Toute personne peut demander la confirmation que des données la concernant sont traitées et en obtenir une copie.",
    processus:
      "Canaliser la demande via le registre RGPD, identifier le traitement concerné, répondre sous un mois avec les informations prévues à l'article 15 du RGPD.",
  },
  "droit-rectification": {
    title: "Droit de rectification",
    description: "Correction des données inexactes ou complétion des données incomplètes.",
    processus:
      "Vérifier l'identité du demandeur, localiser les données dans le système source, appliquer la correction et tracer l'action dans le registre.",
  },
  "droit-effacement": {
    title: "Droit à l'effacement",
    description: "Suppression des données lorsque les conditions de l'article 17 du RGPD sont remplies.",
    processus:
      "Analyser la demande (obligation légale, intérêt légitime, etc.), supprimer ou anonymiser dans les outils concernés, documenter la décision.",
  },
  "droit-opposition": {
    title: "Droit d'opposition",
    description: "Opposition au traitement fondé sur l'intérêt légitime ou à des fins de prospection.",
    processus:
      "Qualifier le fondement du traitement, évaluer les motifs impérieux, cesser le traitement si requis et informer le demandeur.",
  },
  "droit-portabilite": {
    title: "Droit à la portabilité",
    description: "Récupération des données fournies dans un format structuré et lisible par machine.",
    processus:
      "Limiter aux traitements automatisés fondés sur le consentement ou le contrat ; exporter depuis la source et transmettre de manière sécurisée.",
  },
};

type Props = {
  sectionId: ConformitySectionId;
  canEdit: boolean;
};

export function DroitsRgpdPlaceholderView({ sectionId, canEdit }: Props) {
  if (
    sectionId === "registre-licences" ||
    sectionId === "registre-rgpd" ||
    sectionId === "registre-bdd" ||
    sectionId === "registre-traitement-data"
  ) {
    return null;
  }

  const block = CONTENT[sectionId];

  return (
    <article className="max-w-2xl space-y-4">
      <h3 className="text-lg font-semibold">{block.title}</h3>
      <p className="text-sm text-muted-foreground whitespace-normal break-words">{block.description}</p>
      {canEdit && (
        <section className="rounded-md border border-border bg-muted/20 p-4">
          <h4 className="mb-2 text-sm font-medium">Processus DSI</h4>
          <p className="text-sm whitespace-normal break-words">{block.processus}</p>
        </section>
      )}
    </article>
  );
}
