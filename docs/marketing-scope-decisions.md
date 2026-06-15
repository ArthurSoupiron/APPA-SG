# Décisions de cadrage — module Marketing

Document de référence pour les questions ouvertes du plan, avec **valeurs par défaut** retenues pour l’implémentation lorsque l’équipe n’a pas encore tranché.

## LinkedIn

| # | Décision |
|---|----------|
| 1 | Page : `LINKEDIN_ORGANIZATION_ID` (env) |
| 2 | App Developers à créer — admin = responsable marketing |
| 3 | Produits : Community Management + analytics page |
| 4 | **Historisation** : snapshots JSON en `marketing.linkedin_cache` + série `fetched_at` |
| 5 | Bouton « Actualiser » : `marketing.write` |
| 6 | Quota API : afficher cache + bannière d’avertissement |

## YouTube

| # | Décision |
|---|----------|
| 7 | Chaîne : `YOUTUBE_CHANNEL_ID` (env) |
| 8 | OAuth : compte Google de l’utilisateur qui lance le sync (même auth JaegerMyster) |
| 9 | Filtre « podcast » : champ optionnel playlist plus tard |
| 10 | Backfill : **12 mois** au premier sync |
| 11 | Délai Analytics **J+2** accepté |

## Newsletter — produit

| # | Décision |
|---|----------|
| 12 | Éditeur : **blocs** + mode HTML avancé |
| 13 | Langue : **FR** |
| 14 | 3 modèles de base (annonce, digest, événement) |
| 15 | **Planification** date/heure (Europe/Paris) |
| 16 | Envoi **test** vers liste interne |
| 17 | **Pas de pièces jointes** |
| 18 | Expéditeur : `SMTP_FROM` / `SMTP_FROM_NAME` |
| 19 | Volume cible : **&lt; 2 000 emails/jour** (limite Workspace) |
| 20 | Heatmap : **stats par bloc** (ancres trackées) |
| 21 | « Voir en ligne » : URL publique **/newsletter/campagne/[token]** |
| 22 | Désabonnement : **global** + désabonnement par **tag** |

## Newsletter — RGPD

| # | Décision |
|---|----------|
| 23 | Base légale : champ `legal_basis` par tag (consent, contract, legitimate_interest) |
| 24 | Conservation logs : **13 mois** |
| 25 | Droits RGPD : traitement **manuel** par l’équipe |
| 26 | Export consentements : **CSV** depuis l’admin |
| 27 | Pied de mail : template par défaut + override campagne |
| 28 | Import CSV : email, consent_date, source, consent_text **obligatoires** |
| 29 | CRM Myster : **import manuel** (pas de sync auto v1) |

## SMTP Google Workspace

| # | Décision |
|---|----------|
| 30 | Même domaine que l’organisation Workspace |
| 31 | SPF/DKIM/DMARC : **à configurer** (voir guide intégrations) |
| 32 | Recommandé : **smtp-relay.gmail.com** ou `smtp.gmail.com` + mot de passe d’application |
| 33 | Dépassement quota : **file d’attente** + retry ; pas de relais secondaire v1 |

## Webflow

| # | Décision |
|---|----------|
| 34 | Site : `WEBFLOW_SITE_ID` + token API |
| 35 | Champs blog : titre, slug, résumé, corps, auteur, image, meta_title, meta_description, catégories, published_at, statut |
| 36 | Langue : **FR** |
| 37 | Images : **upload Webflow Assets API** |
| 38 | Prévisualisation : rendu **local** du corps |
| 39 | Publication : `marketing.write` |
| 40 | Collection : **création via API** si absente au premier sync |

## Transversal

| # | Décision |
|---|----------|
| 41 | Navigation : **4 sous-pages** + hub `/marketing` |
| 42 | **Tableau de bord** synthèse sur `/marketing` |
| 43 | Notifications : retours API + toasts UI (pas Slack v1) |
| 44 | Variables d’env distinctes dev/prod |
| 45 | MVP : les 4 blocs en parallèle, états vides gracieux sans credentials |
