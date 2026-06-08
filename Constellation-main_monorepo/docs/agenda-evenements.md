# Agenda organisationnel

Module sur `/account/agenda` — événements multi-pôles, visibilité par audience, analytics Postgres + Google Sheets.

## Permissions (UBAC)

| Permission | Rôle |
|------------|------|
| `agenda.read` | Consulter l’agenda |
| `agenda.{pole}.write` | Créer des événements pour le pôle |
| `agenda.{pole}.manage` | Modifier tout événement du pôle + gérer les types |
| Super-admin (`ADMIN_USER_IDS`) | Suppression (soft delete) |

Pôles : `crm`, `marketing`, `rh`, `tresorerie`, `si`, `operations`, `presidence`, `erp`, `academy`, `rfp`.

## Audiences

- **mandat** : utilisateurs `@jeece.fr` (domaine `AGENDA_MANDAT_EMAIL_DOMAIN`)
- **intervenants** : membres du groupe Google `AGENDA_INTERVENANTS_GROUP_EMAIL`
- **externes** : comptes dont l’email n’est pas `@jeece.fr`

Multi-sélection à la création. Les brouillons ne sont visibles que par le créateur (et manage / super-admin).

## API

- `GET/POST /api/app/agenda/events`
- `GET/PATCH/DELETE /api/app/agenda/events/:id`
- `POST /api/app/agenda/events/:id/comments`
- `POST/PATCH /api/app/agenda/events/:id/participants`
- `GET/POST/PATCH/DELETE /api/app/agenda/types?pole=`
- `POST /api/app/agenda/events/export/sheet`
- `POST /api/app/agenda/events/sync/google`

## Variables d’environnement

- `AGENDA_MANDAT_EMAIL_DOMAIN` (défaut `jeece.fr`)
- `AGENDA_INTERVENANTS_GROUP_EMAIL` — email du groupe GW intervenants
- `AGENDA_SHEET_ID` — spreadsheet analytics
- `AGENDA_GOOGLE_SYNC_ENABLED=true` — sync Calendar (nécessite scopes Calendar + re-consent OAuth)

## Export analytics (Sheet)

Onglet `Agenda_Events`, colonnes : identifiants, temps, audiences, participants, RSVP, sync Google, commentaires, horodatages (voir `AGENDA_SHEET_HEADERS` dans le backend).

## Schéma Postgres

Schéma `agenda` : `event`, `event_type`, `event_audience`, `event_participant`, `event_comment`, `event_change_log`, `event_notification`, `user_calendar_sync`, `event_reference_seq`.

Migration : `backend/drizzle/0007_agenda.sql`.
