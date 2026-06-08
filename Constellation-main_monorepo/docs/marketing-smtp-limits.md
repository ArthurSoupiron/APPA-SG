# Limites SMTP — Google Workspace

## Synthèse

L’envoi newsletter via **Google Workspace SMTP** est adapté à un volume **modéré** (association, B2B, alumni). Au-delà, un relais transactionnel EU (Brevo, Mailjet) est recommandé.

## Quotas indicatifs (Google Workspace)

| Offre | Envoi quotidien approximatif |
|-------|------------------------------|
| Workspace Business Starter | ~2 000 / jour |
| Business Standard | ~2 000 / jour (compte) |
| Via relay `smtp-relay.gmail.com` | Selon config admin (souvent plus élevé pour IP autorisées) |

Les limites exactes dépendent de l’admin Google et de la réputation du domaine.

## Implémentation JaegerMyster

- File d’attente `marketing.newsletter_send_queue` avec envoi par **lots** (défaut : 50 emails / minute configurable via `SMTP_BATCH_SIZE`, `SMTP_BATCH_DELAY_MS`).
- En cas d’échec SMTP : statut `failed` + message d’erreur sur la ligne d’envoi.
- **Pas de bascule** vers un second fournisseur en v1.

## Recommandations opérationnelles

1. Utiliser une adresse dédiée (`newsletter@votredomaine.org`).
2. Configurer **SPF**, **DKIM**, **DMARC** sur le domaine.
3. Préférer **smtp-relay.gmail.com** en production si le serveur backend a une IP fixe autorisée dans la console admin Google.
4. Surveiller le taux de rebond ; désactiver automatiquement les adresses en hard bounce.

## Seuil d’alerte

Si `abonnés actifs × campagnes / mois` approche **1 500 emails/jour** en pic, planifier migration vers ESP EU avant blocage Google.
