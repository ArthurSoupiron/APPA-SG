# Typographie Pretext (`PretextBlock`)

Ce dossier centralise le rendu du **texte courant** de l’app via [@chenglou/pretext](https://github.com/chenglou/pretext) : mesure de césure et hauteur sans aller-retour DOM, avec une `line-height` CSS alignée sur le calcul Pretext.

## Pourquoi passer par là ?

- Hauteur / retours à la ligne cohérents avec la typo réelle (Geist + piles `ui-sans-serif`).
- Réutilisation de **métriques** (`PretextMetric`) calibrées sur Tailwind v4.
- Biome (`noRestrictedElements`) interdit les balises brutes `<p>` et `<h1>`–`<h6>` dans les fichiers `web/**/*.tsx` (hors `components/ui/**` et ce fichier d’implémentation). Voir `biome.json` à la racine du dépôt.

## Import

```tsx
import {
  PretextBlock,
  PRETEXT,
  pretextFixed,
  FONT_STACK,
  type PretextMetric,
  type PretextTag,
} from "@/components/typography";
```

Les presets numériques vivent aussi dans `lib/pretext-presets.ts` (réexportés par le barrel ci-dessus).

## `PretextBlock`

Composant **client** (`"use client"`). Il attend une **chaîne unique** à afficher et mesurer.

| Prop        | Rôle                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `text`      | Contenu texte (obligatoire).                                                                                 |
| `metric`    | `PretextMetric` : polices + interlignes `< sm` et `≥ sm` (640px).                                            |
| `as`        | Balise sémantique : `"p"` (défaut), `"h1"` … `"h6"`, `"span"`.                                               |
| `className` | Classes Tailwind (couleur, `max-w-*`, graisse affichée, etc.).                                               |
| …           | Attributs HTML usuels (`id`, `role`, `aria-*`, etc.), sauf `children` / `style` / `dangerouslySetInnerHTML`. |

Exemple :

```tsx
"use client";

import { PretextBlock, PRETEXT } from "@/components/typography";

export function MaSection() {
  return (
    <PretextBlock
      as="h2"
      className="text-sm font-medium text-muted-foreground"
      metric={PRETEXT.smMedium}
      text="Titre de section"
    />
  );
}
```

### Server Components

Tu ne peux pas monter `PretextBlock` directement dans un fichier serveur sans bordure client. Soit le parent est déjà `"use client"`, soit tu extrais un petit composant client qui encapsule le bloc.

## Métriques : `PRETEXT` et `pretextFixed`

`PretextMetric` :

```ts
type PretextMetric = {
  fontDefault: string; // shorthand CSS, ex. "400 14px Geist, …"
  fontSmUp: string; // idem à partir de `min-width: 640px`
  lineHeightDefault: number; // px
  lineHeightSmUp: number;
};
```

Presets prêts à l’emploi (`PRETEXT`) — à faire correspondre aux classes Tailwind du même bloc :

| Clé        | Usage typique                            |
| ---------- | ---------------------------------------- |
| `xs`       | `text-xs`                                |
| `sm`       | `text-sm`                                |
| `smMedium` | `text-sm font-medium`                    |
| `base`     | `text-base`                              |
| `h1Page`   | `text-2xl font-semibold` (titre de page) |
| `micro`    | Très petit (ex. ~10px, interligne serré) |

Taille **identique** mobile et desktop :

```tsx
import { pretextFixed } from "@/components/typography";

const legende = pretextFixed(400, 12, 16); // xs-like partout

<PretextBlock className="text-xs" metric={legende} text="Légende" />;
```

## Métrique responsive custom

Si le preset ne suffit pas (ex. hero avec `text-xl` / `text-2xl`), déclare un objet dans `lib/` :

```ts
// lib/mon-module-pretext.ts
import { FONT_STACK, type PretextMetric } from "@/lib/pretext-presets";

export const monTitre: PretextMetric = {
  fontDefault: `600 20px ${FONT_STACK}`,
  fontSmUp: `600 24px ${FONT_STACK}`,
  lineHeightDefault: 28,
  lineHeightSmUp: 32,
};
```

Référence concrète : `components/landing-home/pretext-landing.ts` (hero landing).

## Texte riche (`<code>`, `<strong>`, liens…)

`PretextBlock` ne prend **pas** de `children` React : une seule string. Pour du markup mélangé :

- découper en plusieurs `PretextBlock` / `span` autour des parties fixes, ou
- utiliser un **`div`** avec un rôle explicite (`role="paragraph"`, `role="note"`, `role="status"`, etc.) pour le bloc riche, en acceptant que Pretext ne mesure pas ce fragment.

Des exemples de `div` « note » existent dans `components/auth/auth-gateway.tsx` (messages avec `<code>`).

## Lint

Dans `**/*.tsx` (hors `components/ui/**` et `components/typography/pretext-block.tsx`), ESLint signale :

- `<p>` → utiliser `PretextBlock` (ou un `div` avec rôle si contenu non string-only, voir ci-dessus).
- `<h1>`–`<h6>` → `PretextBlock as="h1"` (etc.).

## Voir aussi

- Démos : `app/account/page.tsx` (sections Pretext), `components/pretext_test.tsx`, `components/pretext_chat_bubbles.tsx`.
- Bulles chat (logique avancée) : `lib/pretext-chat-bubbles.ts`.
