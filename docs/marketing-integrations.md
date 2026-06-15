# Guide d’intégration — module Marketing

## Variables d’environnement

Ajouter dans `backend/.env` (voir `backend/.env.example`) :

```env
# LinkedIn
LINKEDIN_ORGANIZATION_ID=
LINKEDIN_ACCESS_TOKEN=

# YouTube
YOUTUBE_CHANNEL_ID=

# Webflow
WEBFLOW_SITE_ID=
WEBFLOW_API_TOKEN=
WEBFLOW_BLOG_COLLECTION_SLUG=blog

# SMTP (Google Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=newsletter@votredomaine.org
SMTP_FROM_NAME=JaegerMyster
SMTP_BATCH_SIZE=50
SMTP_BATCH_DELAY_MS=60000

# Newsletter publique
NEWSLETTER_PUBLIC_BASE_URL=http://localhost:3000
MARKETING_CACHE_TTL_HOURS=24
```

## LinkedIn

1. Créer une application sur [LinkedIn Developers](https://www.linkedin.com/developers/).
2. Demander les produits **Community Management** / **Marketing Developer Platform** selon les métriques visées.
3. OAuth 2.0 : récupérer un access token avec les scopes approuvés.
4. Renseigner `LINKEDIN_ORGANIZATION_ID` (URN ou ID numérique de la page).
5. Coller le token dans `LINKEDIN_ACCESS_TOKEN` (renouvellement manuel jusqu’à OAuth stocké en base).

**Sync** : `POST /api/app/marketing/linkedin/sync` (permission `marketing.write`).

## YouTube

1. Projet [Google Cloud Console](https://console.cloud.google.com/) — activer **YouTube Data API v3** et **YouTube Analytics API**.
2. L’utilisateur qui synchronise doit se connecter à JaegerMyster via **Google** (scopes déjà dans Better Auth).
3. Renseigner `YOUTUBE_CHANNEL_ID` (format `UC…` ou ID chaîne).

**Sync** : `POST /api/app/marketing/youtube/sync` — utilise le refresh token du compte Google connecté.

## Webflow

1. Workspace Webflow → **Site settings** → **Apps & integrations** → token API.
2. `WEBFLOW_SITE_ID` : identifiant du site dans l’URL API v2.
3. Au premier sync, la collection `blog` est créée si absente (slug configurable).

**Endpoints** : `/api/app/marketing/webflow/blog/*`

## SMTP Google Workspace

1. Compte de service ou boîte dédiée `newsletter@…`.
2. Admin Google → **Applications** → **Google Workspace** → **Gmail** → routage / relay si IP fixe.
3. DNS : enregistrements SPF (`include:_spf.google.com`), DKIM (clé admin), DMARC (`p=quarantine` minimum).
4. Mot de passe d’application si `smtp.gmail.com` + 2FA.

## Permissions UBAC

Attribuer aux groupes Google via l’admin JaegerMyster :

- `marketing.read` — consultation
- `marketing.write` — sync, campagnes, publication blog
- `marketing.delete` — suppression campagnes / abonnés

## Pages publiques (sans login)

| URL | Rôle |
|-----|------|
| `/newsletter/inscription` | Double opt-in |
| `/newsletter/desabonnement/[token]` | Désabonnement / préférences tags |
| `/newsletter/campagne/[token]` | Version web campagne |

API : `/api/public/newsletter/*` (pas de session requise).
