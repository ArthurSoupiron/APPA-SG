# Ticketing SI

## Accès

| Rôle | Permission | Routes |
|------|------------|--------|
| Utilisateur authentifié | (aucune permission dédiée) | `POST /api/app/si/tickets`, liste « mes tickets » |
| Module SI | `si.read` | `/si`, `/si/tickets` (layout) |
| Agent support | `si.ticket.manage` | `/si/manage`, actions statut / assignation |

## Statuts

| Code | Libellé | Description |
|------|---------|-------------|
| `open` | Ouvert | Créé, non pris en charge |
| `in_progress` | En cours | Agent en traitement |
| `resolved` | Résolu | Réponse fournie, en attente validation |
| `closed` | Fermé | Clôturé |
| `cancelled` | Annulé | Hors périmètre ou erreur |

Transitions réservées aux agents (`si.ticket.manage`), sauf commentaires et pièces jointes pour le demandeur tant que le ticket n’est pas `closed` / `cancelled`.

## Drive

- Variable `DRIVE_SI_PARENT_FOLDER_URL` : dossier racine du Shared Drive SI.
- Arborescence : `{racine}/{YYYY}/{MM}/{reference}-{slug}/`
- Création et upload via **OAuth de l’utilisateur** (scope `drive`).

## Google Sheets (backup)

### Prérequis Google Cloud

Sur le **même projet** que le client OAuth (`GOOGLE_CLIENT_ID`, ex. `247959103924`) :

1. [Activer l’API **Google Sheets API**](https://console.cloud.google.com/apis/library/sheets.googleapis.com) (bouton « Activer »).
2. L’API **Google Drive API** doit aussi être activée (dossiers tickets).
3. Après activation, attendre 1–2 minutes avant de relancer un export.

Sans cela, les logs affichent : `Google Sheets API has not been used in project … or it is disabled`.

### Configuration app

- Variable `DRIVE_SI_TICKETS_SHEET_ID` : spreadsheet maître (ID dans l’URL Google Sheets).
- Onglets par année : **`tickets-AAAA`** (état courant + JSON commentaires / pièces jointes / historique statuts / watchers) et **`history-AAAA`** (événements de l’année). L’année est déduite de la référence `SI-AAAA-MM-NNNN`. L’ancien onglet unique `tickets` reste lisible à l’import.
- Export à chaque mutation (création, statut, assignation, commentaire, pièce jointe).
- Typage utilisateur : champ `category` sur le ticket (`bug`, `acces`, `demande`, `autre`) — pas de table labels séparée.
- Compte d’écriture : OAuth de l’utilisateur qui agit, avec repli sur `SI_SHEET_EXPORT_USER_ID` puis `ADMIN_USER_IDS` si le scope `spreadsheets` manque.
- Le spreadsheet doit être **partagé en édition** avec le compte Google utilisé pour l’export (souvent un admin Workspace).
- Panel agents → **Exporter vers Sheet** : pousse tous les tickets BDD vers les onglets `tickets-AAAA` ; **Réimport Sheet** : lit tous les onglets `tickets-*` vers la BDD.
- En cas d’échec, consulter les logs backend `[si.sheet]`.

## Audit

- Journal global : `ops.app_audit_log`
- Snapshot figé à la création : `si.ticket.audit_snapshot` (30 min / 100 derniers événements utilisateur)

## Référence ticket

Format : `SI-AAAA-MM-NNNN` (ex. `SI-2026-05-0042`).
