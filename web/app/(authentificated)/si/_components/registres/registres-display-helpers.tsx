import type { RegistreUser } from "../../_lib/si-registres-types";

type ExternalLinkProps = {
  url: string | null | undefined;
  /** Texte du lien hypertexte (l’URL n’est pas affichée). */
  label?: string;
};

export function RegistreExternalLink({ url, label }: ExternalLinkProps) {
  const trimmed = url?.trim();
  if (!trimmed) return <>—</>;

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-4 whitespace-normal break-words"
    >
      {label ?? "Ouvrir"}
    </a>
  );
}

export function formatRegistreCreator(user: RegistreUser): string {
  const name = user.name?.trim();
  if (name) return name;
  const email = user.email?.trim();
  if (email) return email;
  return "—";
}

export function formatFacturationDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
