CREATE SCHEMA IF NOT EXISTS "mission";

CREATE TYPE "public"."bon_commande_type" AS ENUM('BC', 'BCR');
CREATE TYPE "public"."rmi_type" AS ENUM('RMI', 'ARMI', 'AARMI');
CREATE TYPE "public"."revision_change_type" AS ENUM('create', 'update', 'avenant');
CREATE TYPE "public"."mission_document_event_type" AS ENUM(
  'bc_created', 'bc_updated', 'bc_avenant',
  'rmi_created', 'rmi_updated', 'rmi_avenant',
  'fa_created', 'fa_updated', 'fa_avenant',
  'fs_created', 'fs_updated', 'fs_avenant',
  'bv_created', 'bv_updated', 'bv_avenant',
  'pvrf_created', 'pvrf_updated', 'pvrf_avenant',
  'qs_created', 'qs_updated', 'qs_avenant'
);

CREATE TABLE "mission"."commercial_clients" (
  "id" text PRIMARY KEY NOT NULL,
  "nom_client" text NOT NULL,
  "prenom_client" text DEFAULT '' NOT NULL,
  "telephone_client" text DEFAULT '' NOT NULL,
  "mail_client" text DEFAULT '' NOT NULL,
  "prospect_id" text REFERENCES "crm"."prospect"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."commercial_entreprises" (
  "id" text PRIMARY KEY NOT NULL,
  "nom_entreprise" text NOT NULL,
  "telephone_entreprise" text DEFAULT '' NOT NULL,
  "mail_entreprise" text DEFAULT '' NOT NULL,
  "pays_entreprise" text DEFAULT 'France' NOT NULL,
  "adresse_entreprise" text DEFAULT '' NOT NULL,
  "ville_entreprise" text DEFAULT '' NOT NULL,
  "code_postal_entreprise" text DEFAULT '' NOT NULL,
  "siren_entreprise" text,
  "prospect_id" text REFERENCES "crm"."prospect"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_cca" (
  "id" text PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL REFERENCES "mission"."commercial_clients"("id") ON DELETE restrict,
  "entreprise_id" text NOT NULL REFERENCES "mission"."commercial_entreprises"("id") ON DELETE restrict,
  "cdp_id" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "mission_name" text NOT NULL,
  "description" text,
  "start_date" timestamp,
  "end_date" timestamp,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "drive_folder_id" text,
  "generated_file_id" text,
  "slack_channel_id" text
);

CREATE TABLE "mission"."mission_bon_commande" (
  "id" text PRIMARY KEY NOT NULL,
  "cca_id" text NOT NULL REFERENCES "mission"."mission_cca"("id") ON DELETE cascade,
  "replaced_by_id" text,
  "type" "bon_commande_type" DEFAULT 'BC' NOT NULL,
  "bc_number" text NOT NULL,
  "livre" boolean DEFAULT false NOT NULL,
  "planning_date" timestamp,
  "planning_end_date" timestamp,
  "generated_file_id" text,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "mission"."mission_bon_commande"
  ADD CONSTRAINT "mission_bon_commande_replaced_by_fk"
  FOREIGN KEY ("replaced_by_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE set null;

CREATE TABLE "mission"."mission_bc_designation" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "intervenant_id" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "titre" text NOT NULL,
  "description" text,
  "nb_jeh" integer,
  "montant_jeh" numeric(10, 2),
  "prix_total_ht" numeric(10, 2),
  "tva" numeric(10, 2),
  "total_ttc" numeric(10, 2),
  "order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_bc_frais" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "texte" text NOT NULL,
  "montant_ht" numeric(10, 2),
  "tva" numeric(10, 2),
  "total_ttc" numeric(10, 2),
  "order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_rmi" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "replaced_by_id" text,
  "cdp_id" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "type" "rmi_type" DEFAULT 'RMI' NOT NULL,
  "rmi_number" text NOT NULL,
  "generated_file_id" text,
  "meeting_date" timestamp,
  "participants" text,
  "notes" text,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "mission"."mission_rmi"
  ADD CONSTRAINT "mission_rmi_replaced_by_fk"
  FOREIGN KEY ("replaced_by_id") REFERENCES "mission"."mission_rmi"("id") ON DELETE set null;

CREATE TABLE "mission"."mission_rmi_intervenant_assignation" (
  "id" text PRIMARY KEY NOT NULL,
  "rmi_id" text NOT NULL REFERENCES "mission"."mission_rmi"("id") ON DELETE cascade,
  "intervenant_id" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "designation_id" text REFERENCES "mission"."mission_bc_designation"("id") ON DELETE set null,
  "start_date" timestamp,
  "deadline" timestamp,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_fa" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "fa_number" text NOT NULL,
  "amount" numeric(10, 2),
  "currency" text DEFAULT 'EUR',
  "issue_date" timestamp,
  "due_date" timestamp,
  "regle" boolean DEFAULT false NOT NULL,
  "regle_at" timestamp,
  "generated_file_id" text,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_fs" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "fs_number" text NOT NULL,
  "amount" numeric(10, 2),
  "currency" text DEFAULT 'EUR',
  "issue_date" timestamp,
  "due_date" timestamp,
  "regle" boolean DEFAULT false NOT NULL,
  "regle_at" timestamp,
  "generated_file_id" text,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_bv" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "intervenant_id" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "bv_number" text NOT NULL,
  "amount" numeric(10, 2),
  "currency" text DEFAULT 'EUR',
  "issue_date" timestamp,
  "beneficiary" text,
  "iban" text,
  "verse" boolean DEFAULT false NOT NULL,
  "verse_at" timestamp,
  "generated_file_id" text,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_pvrf" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "pvrf_number" text NOT NULL,
  "generated_file_id" text,
  "reception_date" timestamp,
  "validated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "client_validated" boolean DEFAULT false NOT NULL,
  "entreprise_validated" boolean DEFAULT false NOT NULL,
  "validation_date" timestamp,
  "notes" text,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_qs" (
  "id" text PRIMARY KEY NOT NULL,
  "bc_id" text NOT NULL REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade,
  "qs_number" text NOT NULL,
  "generated_file_id" text,
  "validation_date" timestamp,
  "validated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "notes" text,
  "created_by" text NOT NULL REFERENCES "auth"."user"("id") ON DELETE restrict,
  "updated_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_bc_revision" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "change_type" "revision_change_type" NOT NULL,
  "payload_snapshot" jsonb,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "reason" text,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_rmi_revision" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "change_type" "revision_change_type" NOT NULL,
  "payload_snapshot" jsonb,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "reason" text,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_fa_revision" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "change_type" "revision_change_type" NOT NULL,
  "payload_snapshot" jsonb,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "reason" text,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_fs_revision" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "change_type" "revision_change_type" NOT NULL,
  "payload_snapshot" jsonb,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "reason" text,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_bv_revision" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "change_type" "revision_change_type" NOT NULL,
  "payload_snapshot" jsonb,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "reason" text,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_pvrf_revision" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "change_type" "revision_change_type" NOT NULL,
  "payload_snapshot" jsonb,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "reason" text,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_qs_revision" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "change_type" "revision_change_type" NOT NULL,
  "payload_snapshot" jsonb,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "reason" text,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_document_events" (
  "id" text PRIMARY KEY NOT NULL,
  "mission_id" text NOT NULL REFERENCES "mission"."mission_cca"("id") ON DELETE cascade,
  "bc_id" text REFERENCES "mission"."mission_bon_commande"("id") ON DELETE set null,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "event_type" "mission_document_event_type" NOT NULL,
  "revision_number" integer DEFAULT 1,
  "label" text NOT NULL,
  "changed_by" text REFERENCES "auth"."user"("id") ON DELETE set null,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."mission_slack_group_config" (
  "group_id" text PRIMARY KEY NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mission"."gm_html_template_registry" (
  "doc_type" text PRIMARY KEY NOT NULL,
  "template_path" text NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "synced_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "commercial_clients_prospect_idx" ON "mission"."commercial_clients" ("prospect_id");
CREATE INDEX "commercial_entreprises_prospect_idx" ON "mission"."commercial_entreprises" ("prospect_id");
CREATE INDEX "commercial_entreprises_nom_idx" ON "mission"."commercial_entreprises" ("nom_entreprise");
CREATE INDEX "mission_bc_revision_entity_idx" ON "mission"."mission_bc_revision" ("entity_id", "revision_number");
CREATE INDEX "mission_rmi_revision_entity_idx" ON "mission"."mission_rmi_revision" ("entity_id", "revision_number");
CREATE INDEX "mission_fa_revision_entity_idx" ON "mission"."mission_fa_revision" ("entity_id", "revision_number");
CREATE INDEX "mission_fs_revision_entity_idx" ON "mission"."mission_fs_revision" ("entity_id", "revision_number");
CREATE INDEX "mission_bv_revision_entity_idx" ON "mission"."mission_bv_revision" ("entity_id", "revision_number");
CREATE INDEX "mission_pvrf_revision_entity_idx" ON "mission"."mission_pvrf_revision" ("entity_id", "revision_number");
CREATE INDEX "mission_qs_revision_entity_idx" ON "mission"."mission_qs_revision" ("entity_id", "revision_number");
CREATE INDEX "mission_document_events_mission_idx" ON "mission"."mission_document_events" ("mission_id", "changed_at");
CREATE INDEX "mission_document_events_bc_idx" ON "mission"."mission_document_events" ("bc_id");

ALTER TABLE "agenda"."event" ADD COLUMN IF NOT EXISTS "mission_id" text;
ALTER TABLE "agenda"."event" ADD COLUMN IF NOT EXISTS "milestone_kind" text;
ALTER TABLE "agenda"."event" ADD COLUMN IF NOT EXISTS "mission_bc_id" text;
