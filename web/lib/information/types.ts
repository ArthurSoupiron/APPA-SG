/**
 * Blocs de contenu des pages d'information (mentions légales, CGU, etc.).
 * Chaque bloc est une donnée pure (pas de JSX) : le rendu est délégué à
 * `DocumentFromBlocks` qui passe par PretextBlock.
 */
export type InfoBlock =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "bullet"; text: string };

export type InfoDocument = readonly InfoBlock[];
