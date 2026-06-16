CREATE SCHEMA "action_plan";
--> statement-breakpoint
CREATE SCHEMA "agenda";
--> statement-breakpoint
CREATE SCHEMA "assoc";
--> statement-breakpoint
CREATE SCHEMA "marketing";
--> statement-breakpoint
CREATE SCHEMA "mission";
--> statement-breakpoint
CREATE SCHEMA "si_registres";
--> statement-breakpoint
CREATE TYPE "public"."bon_commande_type" AS ENUM('BC', 'BCR');--> statement-breakpoint
CREATE TYPE "public"."mission_document_event_type" AS ENUM('bc_created', 'bc_updated', 'bc_avenant', 'rmi_created', 'rmi_updated', 'rmi_avenant', 'fa_created', 'fa_updated', 'fa_avenant', 'fs_created', 'fs_updated', 'fs_avenant', 'bv_created', 'bv_updated', 'bv_avenant', 'pvrf_created', 'pvrf_updated', 'pvrf_avenant', 'qs_created', 'qs_updated', 'qs_avenant');--> statement-breakpoint
CREATE TYPE "public"."revision_change_type" AS ENUM('create', 'update', 'avenant');--> statement-breakpoint
CREATE TYPE "public"."rmi_type" AS ENUM('RMI', 'ARMI', 'AARMI');--> statement-breakpoint
CREATE TABLE "action_plan"."action" (
	"id" text PRIMARY KEY NOT NULL,
	"smart_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"owner" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"priority" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"due_date" timestamp,
	"campus" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "action_progress_check" CHECK ("action_plan"."action"."progress" >= 0 AND "action_plan"."action"."progress" <= 100),
	CONSTRAINT "action_status_check" CHECK ("action_plan"."action"."status" IN ('not_started', 'in_progress', 'done', 'blocked')),
	CONSTRAINT "action_campus_check" CHECK ("action_plan"."action"."campus" IS NULL OR "action_plan"."action"."campus" IN ('paris', 'lyon', 'marseille'))
);
--> statement-breakpoint
CREATE TABLE "action_plan"."action_pole" (
	"action_id" text NOT NULL,
	"pole" text NOT NULL,
	CONSTRAINT "action_pole_action_id_pole_pk" PRIMARY KEY("action_id","pole"),
	CONSTRAINT "action_pole_check" CHECK ("action_plan"."action_pole"."pole" IN ('crm', 'marketing', 'rh', 'tresorerie', 'si', 'operations', 'presidence', 'erp', 'academy', 'rfp'))
);
--> statement-breakpoint
CREATE TABLE "action_plan"."axis" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_plan"."smart" (
	"id" text PRIMARY KEY NOT NULL,
	"sub_axis_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_plan"."sub_action" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"owner" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"priority" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"due_date" timestamp,
	"campus" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sub_action_progress_check" CHECK ("action_plan"."sub_action"."progress" >= 0 AND "action_plan"."sub_action"."progress" <= 100),
	CONSTRAINT "sub_action_status_check" CHECK ("action_plan"."sub_action"."status" IN ('not_started', 'in_progress', 'done', 'blocked')),
	CONSTRAINT "sub_action_campus_check" CHECK ("action_plan"."sub_action"."campus" IS NULL OR "action_plan"."sub_action"."campus" IN ('paris', 'lyon', 'marseille'))
);
--> statement-breakpoint
CREATE TABLE "action_plan"."sub_action_pole" (
	"sub_action_id" text NOT NULL,
	"pole" text NOT NULL,
	CONSTRAINT "sub_action_pole_sub_action_id_pole_pk" PRIMARY KEY("sub_action_id","pole"),
	CONSTRAINT "sub_action_pole_check" CHECK ("action_plan"."sub_action_pole"."pole" IN ('crm', 'marketing', 'rh', 'tresorerie', 'si', 'operations', 'presidence', 'erp', 'academy', 'rfp'))
);
--> statement-breakpoint
CREATE TABLE "action_plan"."sub_axis" (
	"id" text PRIMARY KEY NOT NULL,
	"axis_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda"."event" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"pole" text NOT NULL,
	"type_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"timezone" text,
	"location" text,
	"meet_url" text,
	"drive_url" text,
	"mission_id" text,
	"milestone_kind" text,
	"mission_bc_id" text,
	"recurrence_rule" text,
	"recurrence_parent_id" text,
	"google_calendar_id" text,
	"google_event_id" text,
	"sync_status" text,
	"last_synced_at" timestamp,
	"source" text DEFAULT 'app' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "event_pole_check" CHECK ("agenda"."event"."pole" IN ('crm', 'marketing', 'rh', 'tresorerie', 'si', 'operations', 'presidence', 'erp', 'academy', 'rfp')),
	CONSTRAINT "event_status_check" CHECK ("agenda"."event"."status" IN ('draft', 'published', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_audience" (
	"event_id" text NOT NULL,
	"audience" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_audience_event_id_audience_pk" PRIMARY KEY("event_id","audience"),
	CONSTRAINT "event_audience_check" CHECK ("agenda"."event_audience"."audience" IN ('mandat', 'intervenants', 'externes'))
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_audience_group" (
	"event_id" text NOT NULL,
	"workspace_group_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_audience_group_event_id_workspace_group_id_pk" PRIMARY KEY("event_id","workspace_group_id")
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_change_log" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"display_name" text,
	"rsvp_status" text DEFAULT 'pending' NOT NULL,
	"role" text DEFAULT 'attendee' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_participant_rsvp_check" CHECK ("agenda"."event_participant"."rsvp_status" IN ('pending', 'accepted', 'declined', 'tentative')),
	CONSTRAINT "event_participant_role_check" CHECK ("agenda"."event_participant"."role" IN ('organizer', 'attendee'))
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_reference_seq" (
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "event_reference_seq_year_month_pk" PRIMARY KEY("year","month")
);
--> statement-breakpoint
CREATE TABLE "agenda"."event_type" (
	"id" text PRIMARY KEY NOT NULL,
	"pole" text NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_type_pole_check" CHECK ("agenda"."event_type"."pole" IN ('crm', 'marketing', 'rh', 'tresorerie', 'si', 'operations', 'presidence', 'erp', 'academy', 'rfp'))
);
--> statement-breakpoint
CREATE TABLE "agenda"."user_calendar_sync" (
	"user_id" text PRIMARY KEY NOT NULL,
	"google_calendar_id" text,
	"sync_token" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assoc"."conformite_check" (
	"id" text PRIMARY KEY NOT NULL,
	"k" text NOT NULL,
	"s" text DEFAULT '' NOT NULL,
	"state" text DEFAULT 'todo' NOT NULL,
	"ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assoc"."deadline" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"title" text NOT NULL,
	"sub" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assoc"."document" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"cat" text NOT NULL,
	"pages" integer DEFAULT 1 NOT NULL,
	"format" text DEFAULT 'PDF' NOT NULL,
	"size" text DEFAULT '—' NOT NULL,
	"mandat" text DEFAULT '25–26' NOT NULL,
	"ref" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"signers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"date" text NOT NULL,
	"date_abs" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"security" text DEFAULT 'Interne' NOT NULL,
	"fav" boolean DEFAULT false NOT NULL,
	"drive_file_id" text,
	"drive_web_view_link" text,
	"signature_data" text,
	"signed_by" text,
	"signed_at" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assoc"."member" (
	"id" text PRIMARY KEY NOT NULL,
	"first" text NOT NULL,
	"last" text NOT NULL,
	"initials" text NOT NULL,
	"role" text NOT NULL,
	"pole" text NOT NULL,
	"promo" integer NOT NULL,
	"year" text NOT NULL,
	"status" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '—' NOT NULL,
	"joined" text NOT NULL,
	"city" text DEFAULT '—' NOT NULL,
	"address" text,
	"student_id" text,
	"jeece_id" text,
	"birth" text,
	"docs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"mandates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."linkedin_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"synced_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_block" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"block_type" text NOT NULL,
	"content" jsonb NOT NULL,
	"track_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"preheader" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"template_key" text,
	"public_view_token" text NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"footer_html" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_campaign_list" (
	"campaign_id" text NOT NULL,
	"list_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_campaign_tag" (
	"campaign_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_confirm_token" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_consent_log" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text NOT NULL,
	"mode" text NOT NULL,
	"source" text NOT NULL,
	"consent_text" text NOT NULL,
	"legal_basis" text,
	"ip_hash" text,
	"user_agent" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_event" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text,
	"send_id" text,
	"event_type" text NOT NULL,
	"block_track_id" text,
	"link_url" text,
	"ip_hash" text,
	"user_agent" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_list" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_list_subscriber" (
	"list_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_send" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"message_id" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_send_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"first_name" text,
	"last_name" text,
	"unsubscribe_token" text NOT NULL,
	"global_unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_subscriber_tag" (
	"subscriber_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"legal_basis" text DEFAULT 'consent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."webflow_blog_item" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"webflow_item_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text DEFAULT '' NOT NULL,
	"author" text,
	"image_url" text,
	"meta_title" text,
	"meta_description" text,
	"categories" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"is_draft" boolean DEFAULT true NOT NULL,
	"field_data" jsonb,
	"last_synced_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing"."webflow_sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"collection_id" text,
	"collection_slug" text DEFAULT 'blog' NOT NULL,
	"last_synced_at" timestamp,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "marketing"."youtube_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"synced_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_bc_designation" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"intervenant_id" text,
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
--> statement-breakpoint
CREATE TABLE "mission"."mission_bc_frais" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"texte" text NOT NULL,
	"montant_ht" numeric(10, 2),
	"tva" numeric(10, 2),
	"total_ttc" numeric(10, 2),
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_bon_commande" (
	"id" text PRIMARY KEY NOT NULL,
	"cca_id" text NOT NULL,
	"replaced_by_id" text,
	"type" "bon_commande_type" DEFAULT 'BC' NOT NULL,
	"bc_number" text NOT NULL,
	"livre" boolean DEFAULT false NOT NULL,
	"planning_date" timestamp,
	"planning_end_date" timestamp,
	"generated_file_id" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_bv" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"intervenant_id" text,
	"bv_number" text NOT NULL,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'EUR',
	"issue_date" timestamp,
	"beneficiary" text,
	"iban" text,
	"verse" boolean DEFAULT false NOT NULL,
	"verse_at" timestamp,
	"generated_file_id" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_cca" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"entreprise_id" text NOT NULL,
	"cdp_id" text,
	"mission_name" text NOT NULL,
	"description" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"drive_folder_id" text,
	"generated_file_id" text,
	"slack_channel_id" text
);
--> statement-breakpoint
CREATE TABLE "mission"."commercial_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"nom_client" text NOT NULL,
	"prenom_client" text DEFAULT '' NOT NULL,
	"telephone_client" text DEFAULT '' NOT NULL,
	"mail_client" text DEFAULT '' NOT NULL,
	"prospect_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"prospect_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_fa" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"fa_number" text NOT NULL,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'EUR',
	"issue_date" timestamp,
	"due_date" timestamp,
	"regle" boolean DEFAULT false NOT NULL,
	"regle_at" timestamp,
	"generated_file_id" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_fs" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"fs_number" text NOT NULL,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'EUR',
	"issue_date" timestamp,
	"due_date" timestamp,
	"regle" boolean DEFAULT false NOT NULL,
	"regle_at" timestamp,
	"generated_file_id" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."gm_drive_template_tags" (
	"doc_type" text PRIMARY KEY NOT NULL,
	"drive_file_id" text NOT NULL,
	"drive_file_name" text NOT NULL,
	"tags" jsonb NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."gm_html_template_registry" (
	"doc_type" text PRIMARY KEY NOT NULL,
	"template_path" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_pvrf" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"pvrf_number" text NOT NULL,
	"generated_file_id" text,
	"reception_date" timestamp,
	"validated_by" text,
	"client_validated" boolean DEFAULT false NOT NULL,
	"entreprise_validated" boolean DEFAULT false NOT NULL,
	"validation_date" timestamp,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_qs" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"qs_number" text NOT NULL,
	"generated_file_id" text,
	"validation_date" timestamp,
	"validated_by" text,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_bc_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"change_type" "revision_change_type" NOT NULL,
	"payload_snapshot" jsonb,
	"changed_by" text,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_bv_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"change_type" "revision_change_type" NOT NULL,
	"payload_snapshot" jsonb,
	"changed_by" text,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_document_events" (
	"id" text PRIMARY KEY NOT NULL,
	"mission_id" text NOT NULL,
	"bc_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"event_type" "mission_document_event_type" NOT NULL,
	"revision_number" integer DEFAULT 1,
	"label" text NOT NULL,
	"changed_by" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_fa_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"change_type" "revision_change_type" NOT NULL,
	"payload_snapshot" jsonb,
	"changed_by" text,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_fs_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"change_type" "revision_change_type" NOT NULL,
	"payload_snapshot" jsonb,
	"changed_by" text,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_pvrf_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"change_type" "revision_change_type" NOT NULL,
	"payload_snapshot" jsonb,
	"changed_by" text,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_qs_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"change_type" "revision_change_type" NOT NULL,
	"payload_snapshot" jsonb,
	"changed_by" text,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_rmi_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"change_type" "revision_change_type" NOT NULL,
	"payload_snapshot" jsonb,
	"changed_by" text,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_rmi" (
	"id" text PRIMARY KEY NOT NULL,
	"bc_id" text NOT NULL,
	"replaced_by_id" text,
	"cdp_id" text,
	"type" "rmi_type" DEFAULT 'RMI' NOT NULL,
	"rmi_number" text NOT NULL,
	"generated_file_id" text,
	"meeting_date" timestamp,
	"participants" text,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_rmi_intervenant_assignation" (
	"id" text PRIMARY KEY NOT NULL,
	"rmi_id" text NOT NULL,
	"intervenant_id" text NOT NULL,
	"designation_id" text,
	"start_date" timestamp,
	"deadline" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission"."mission_slack_group_config" (
	"group_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops"."system_auth_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"email_password_enabled" boolean DEFAULT true NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sg"."slack_user_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"handle" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"user_count" integer DEFAULT 0 NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"last_refreshed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si_registres"."registre_bdd" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"annee_civile" integer NOT NULL,
	"nom" text NOT NULL,
	"drive_folder_url" text,
	"traitement_data_id" text,
	"sheet_excel_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si_registres"."registre_licences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"annee_civile" integer NOT NULL,
	"nom" text NOT NULL,
	"drive_folder_url" text,
	"date_facturation" timestamp,
	"utilisation_commerciale" boolean DEFAULT false,
	"licence_commerciale_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si_registres"."registre_rgpd" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"annee_civile" integer NOT NULL,
	"nom" text NOT NULL,
	"drive_folder_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si_registres"."traitement_data" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nom_traitement" text NOT NULL,
	"reference" text NOT NULL,
	"description_finalite" text,
	"date_creation_fiche" timestamp,
	"date_mise_a_jour_fiche" timestamp,
	"drive_folder_url" text,
	"fiche_pdf_url" text,
	"preuve_consentement_url" text,
	"preuve_mentions_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "si"."ticket_label" CASCADE;--> statement-breakpoint
DROP TABLE "si"."ticket_label_assignment" CASCADE;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "titre" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "email_statut" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "email_secondaire" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "telephone_mobile" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "telephone_corporate" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "telephone_direct" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "ville" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "pays" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "seniorite" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "departements" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "twitter" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "github" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "site_web" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "linkedin_entreprise" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "effectifs" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "mots_cles" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "technologies" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "chiffre_affaires" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "annee_fondation" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "adresse_entreprise" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "ville_entreprise" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "region_entreprise" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "pays_entreprise" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "code_postal_entreprise" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "telephone_entreprise" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "entreprise_pour_emails" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "apollo_contact_id" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "apollo_account_id" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "etape_apollo" text;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD COLUMN "proprietaire_apollo" text;--> statement-breakpoint
ALTER TABLE "action_plan"."action" ADD CONSTRAINT "action_smart_id_smart_id_fk" FOREIGN KEY ("smart_id") REFERENCES "action_plan"."smart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan"."action_pole" ADD CONSTRAINT "action_pole_action_id_action_id_fk" FOREIGN KEY ("action_id") REFERENCES "action_plan"."action"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan"."smart" ADD CONSTRAINT "smart_sub_axis_id_sub_axis_id_fk" FOREIGN KEY ("sub_axis_id") REFERENCES "action_plan"."sub_axis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan"."sub_action" ADD CONSTRAINT "sub_action_action_id_action_id_fk" FOREIGN KEY ("action_id") REFERENCES "action_plan"."action"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan"."sub_action_pole" ADD CONSTRAINT "sub_action_pole_sub_action_id_sub_action_id_fk" FOREIGN KEY ("sub_action_id") REFERENCES "action_plan"."sub_action"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan"."sub_axis" ADD CONSTRAINT "sub_axis_axis_id_axis_id_fk" FOREIGN KEY ("axis_id") REFERENCES "action_plan"."axis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event" ADD CONSTRAINT "event_type_id_event_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "agenda"."event_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event" ADD CONSTRAINT "event_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event" ADD CONSTRAINT "event_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_audience" ADD CONSTRAINT "event_audience_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_audience_group" ADD CONSTRAINT "event_audience_group_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_audience_group" ADD CONSTRAINT "event_audience_group_workspace_group_id_workspace_group_id_fk" FOREIGN KEY ("workspace_group_id") REFERENCES "gw"."workspace_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_change_log" ADD CONSTRAINT "event_change_log_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_change_log" ADD CONSTRAINT "event_change_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_comment" ADD CONSTRAINT "event_comment_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_comment" ADD CONSTRAINT "event_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_notification" ADD CONSTRAINT "event_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_notification" ADD CONSTRAINT "event_notification_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_participant" ADD CONSTRAINT "event_participant_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."event_participant" ADD CONSTRAINT "event_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda"."user_calendar_sync" ADD CONSTRAINT "user_calendar_sync_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_block" ADD CONSTRAINT "newsletter_block_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign" ADD CONSTRAINT "newsletter_campaign_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_list" ADD CONSTRAINT "newsletter_campaign_list_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_list" ADD CONSTRAINT "newsletter_campaign_list_list_id_newsletter_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "marketing"."newsletter_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_tag" ADD CONSTRAINT "newsletter_campaign_tag_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_tag" ADD CONSTRAINT "newsletter_campaign_tag_tag_id_newsletter_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "marketing"."newsletter_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_confirm_token" ADD CONSTRAINT "newsletter_confirm_token_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_consent_log" ADD CONSTRAINT "newsletter_consent_log_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_event" ADD CONSTRAINT "newsletter_event_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_event" ADD CONSTRAINT "newsletter_event_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_event" ADD CONSTRAINT "newsletter_event_send_id_newsletter_send_id_fk" FOREIGN KEY ("send_id") REFERENCES "marketing"."newsletter_send"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_list_subscriber" ADD CONSTRAINT "newsletter_list_subscriber_list_id_newsletter_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "marketing"."newsletter_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_list_subscriber" ADD CONSTRAINT "newsletter_list_subscriber_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send" ADD CONSTRAINT "newsletter_send_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send" ADD CONSTRAINT "newsletter_send_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send_queue" ADD CONSTRAINT "newsletter_send_queue_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send_queue" ADD CONSTRAINT "newsletter_send_queue_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_subscriber_tag" ADD CONSTRAINT "newsletter_subscriber_tag_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_subscriber_tag" ADD CONSTRAINT "newsletter_subscriber_tag_tag_id_newsletter_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "marketing"."newsletter_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing"."webflow_blog_item" ADD CONSTRAINT "webflow_blog_item_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bc_designation" ADD CONSTRAINT "mission_bc_designation_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bc_designation" ADD CONSTRAINT "mission_bc_designation_intervenant_id_user_id_fk" FOREIGN KEY ("intervenant_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bc_frais" ADD CONSTRAINT "mission_bc_frais_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bon_commande" ADD CONSTRAINT "mission_bon_commande_cca_id_mission_cca_id_fk" FOREIGN KEY ("cca_id") REFERENCES "mission"."mission_cca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bon_commande" ADD CONSTRAINT "mission_bon_commande_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bon_commande" ADD CONSTRAINT "mission_bon_commande_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bv" ADD CONSTRAINT "mission_bv_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bv" ADD CONSTRAINT "mission_bv_intervenant_id_user_id_fk" FOREIGN KEY ("intervenant_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bv" ADD CONSTRAINT "mission_bv_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bv" ADD CONSTRAINT "mission_bv_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_cca" ADD CONSTRAINT "mission_cca_client_id_commercial_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "mission"."commercial_clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_cca" ADD CONSTRAINT "mission_cca_entreprise_id_commercial_entreprises_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "mission"."commercial_entreprises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_cca" ADD CONSTRAINT "mission_cca_cdp_id_user_id_fk" FOREIGN KEY ("cdp_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_cca" ADD CONSTRAINT "mission_cca_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_cca" ADD CONSTRAINT "mission_cca_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."commercial_clients" ADD CONSTRAINT "commercial_clients_prospect_id_prospect_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "crm"."prospect"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."commercial_entreprises" ADD CONSTRAINT "commercial_entreprises_prospect_id_prospect_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "crm"."prospect"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fa" ADD CONSTRAINT "mission_fa_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fa" ADD CONSTRAINT "mission_fa_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fa" ADD CONSTRAINT "mission_fa_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fs" ADD CONSTRAINT "mission_fs_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fs" ADD CONSTRAINT "mission_fs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fs" ADD CONSTRAINT "mission_fs_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_pvrf" ADD CONSTRAINT "mission_pvrf_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_pvrf" ADD CONSTRAINT "mission_pvrf_validated_by_user_id_fk" FOREIGN KEY ("validated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_pvrf" ADD CONSTRAINT "mission_pvrf_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_pvrf" ADD CONSTRAINT "mission_pvrf_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_qs" ADD CONSTRAINT "mission_qs_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_qs" ADD CONSTRAINT "mission_qs_validated_by_user_id_fk" FOREIGN KEY ("validated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_qs" ADD CONSTRAINT "mission_qs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_qs" ADD CONSTRAINT "mission_qs_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bc_revision" ADD CONSTRAINT "mission_bc_revision_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_bv_revision" ADD CONSTRAINT "mission_bv_revision_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_document_events" ADD CONSTRAINT "mission_document_events_mission_id_mission_cca_id_fk" FOREIGN KEY ("mission_id") REFERENCES "mission"."mission_cca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_document_events" ADD CONSTRAINT "mission_document_events_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_document_events" ADD CONSTRAINT "mission_document_events_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fa_revision" ADD CONSTRAINT "mission_fa_revision_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_fs_revision" ADD CONSTRAINT "mission_fs_revision_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_pvrf_revision" ADD CONSTRAINT "mission_pvrf_revision_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_qs_revision" ADD CONSTRAINT "mission_qs_revision_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi_revision" ADD CONSTRAINT "mission_rmi_revision_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi" ADD CONSTRAINT "mission_rmi_bc_id_mission_bon_commande_id_fk" FOREIGN KEY ("bc_id") REFERENCES "mission"."mission_bon_commande"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi" ADD CONSTRAINT "mission_rmi_cdp_id_user_id_fk" FOREIGN KEY ("cdp_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi" ADD CONSTRAINT "mission_rmi_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi" ADD CONSTRAINT "mission_rmi_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi_intervenant_assignation" ADD CONSTRAINT "mission_rmi_intervenant_assignation_rmi_id_mission_rmi_id_fk" FOREIGN KEY ("rmi_id") REFERENCES "mission"."mission_rmi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi_intervenant_assignation" ADD CONSTRAINT "mission_rmi_intervenant_assignation_intervenant_id_user_id_fk" FOREIGN KEY ("intervenant_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission"."mission_rmi_intervenant_assignation" ADD CONSTRAINT "mission_rmi_intervenant_assignation_designation_id_mission_bc_designation_id_fk" FOREIGN KEY ("designation_id") REFERENCES "mission"."mission_bc_designation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops"."system_auth_policy" ADD CONSTRAINT "system_auth_policy_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si_registres"."registre_bdd" ADD CONSTRAINT "registre_bdd_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si_registres"."registre_bdd" ADD CONSTRAINT "registre_bdd_traitement_data_id_traitement_data_id_fk" FOREIGN KEY ("traitement_data_id") REFERENCES "si_registres"."traitement_data"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si_registres"."registre_licences" ADD CONSTRAINT "registre_licences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si_registres"."registre_rgpd" ADD CONSTRAINT "registre_rgpd_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si_registres"."traitement_data" ADD CONSTRAINT "traitement_data_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_smart_id_idx" ON "action_plan"."action" USING btree ("smart_id");--> statement-breakpoint
CREATE INDEX "action_status_idx" ON "action_plan"."action" USING btree ("status");--> statement-breakpoint
CREATE INDEX "action_sort_order_idx" ON "action_plan"."action" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "action_pole_pole_idx" ON "action_plan"."action_pole" USING btree ("pole");--> statement-breakpoint
CREATE INDEX "axis_sort_order_idx" ON "action_plan"."axis" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "smart_sub_axis_id_idx" ON "action_plan"."smart" USING btree ("sub_axis_id");--> statement-breakpoint
CREATE INDEX "smart_sort_order_idx" ON "action_plan"."smart" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "sub_action_action_id_idx" ON "action_plan"."sub_action" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "sub_action_status_idx" ON "action_plan"."sub_action" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sub_action_sort_order_idx" ON "action_plan"."sub_action" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "sub_action_pole_pole_idx" ON "action_plan"."sub_action_pole" USING btree ("pole");--> statement-breakpoint
CREATE INDEX "sub_axis_axis_id_idx" ON "action_plan"."sub_axis" USING btree ("axis_id");--> statement-breakpoint
CREATE INDEX "sub_axis_sort_order_idx" ON "action_plan"."sub_axis" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "event_reference_unique" ON "agenda"."event" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "event_pole_starts_idx" ON "agenda"."event" USING btree ("pole","starts_at");--> statement-breakpoint
CREATE INDEX "event_status_starts_idx" ON "agenda"."event" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "event_created_by_idx" ON "agenda"."event" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "event_recurrence_parent_idx" ON "agenda"."event" USING btree ("recurrence_parent_id");--> statement-breakpoint
CREATE INDEX "event_audience_audience_idx" ON "agenda"."event_audience" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "event_audience_group_group_idx" ON "agenda"."event_audience_group" USING btree ("workspace_group_id");--> statement-breakpoint
CREATE INDEX "event_change_log_event_idx" ON "agenda"."event_change_log" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "event_change_log_action_idx" ON "agenda"."event_change_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "event_comment_event_idx" ON "agenda"."event_comment" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "event_comment_user_idx" ON "agenda"."event_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_notification_user_read_idx" ON "agenda"."event_notification" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "event_notification_event_idx" ON "agenda"."event_notification" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_participant_event_email_unique" ON "agenda"."event_participant" USING btree ("event_id","email");--> statement-breakpoint
CREATE INDEX "event_participant_event_idx" ON "agenda"."event_participant" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_participant_user_idx" ON "agenda"."event_participant" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_type_pole_slug_unique" ON "agenda"."event_type" USING btree ("pole","slug");--> statement-breakpoint
CREATE INDEX "event_type_pole_active_idx" ON "agenda"."event_type" USING btree ("pole","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "user_calendar_sync_user_unique" ON "agenda"."user_calendar_sync" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assoc_member_email_unique" ON "assoc"."member" USING btree ("email");--> statement-breakpoint
CREATE INDEX "linkedin_cache_org_fetched_idx" ON "marketing"."linkedin_cache" USING btree ("organization_id","fetched_at");--> statement-breakpoint
CREATE INDEX "newsletter_block_campaign_idx" ON "marketing"."newsletter_block" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_block_track_uidx" ON "marketing"."newsletter_block" USING btree ("campaign_id","track_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_view_token_uidx" ON "marketing"."newsletter_campaign" USING btree ("public_view_token");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_status_idx" ON "marketing"."newsletter_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_scheduled_idx" ON "marketing"."newsletter_campaign" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_list_uidx" ON "marketing"."newsletter_campaign_list" USING btree ("campaign_id","list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_tag_uidx" ON "marketing"."newsletter_campaign_tag" USING btree ("campaign_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_confirm_token_token_uidx" ON "marketing"."newsletter_confirm_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "newsletter_confirm_token_sub_idx" ON "marketing"."newsletter_confirm_token" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_consent_log_sub_idx" ON "marketing"."newsletter_consent_log" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_consent_log_recorded_idx" ON "marketing"."newsletter_consent_log" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "newsletter_event_campaign_type_idx" ON "marketing"."newsletter_event" USING btree ("campaign_id","event_type");--> statement-breakpoint
CREATE INDEX "newsletter_event_block_idx" ON "marketing"."newsletter_event" USING btree ("campaign_id","block_track_id");--> statement-breakpoint
CREATE INDEX "newsletter_event_occurred_idx" ON "marketing"."newsletter_event" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "newsletter_list_name_idx" ON "marketing"."newsletter_list" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_list_subscriber_uidx" ON "marketing"."newsletter_list_subscriber" USING btree ("list_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_list_subscriber_sub_idx" ON "marketing"."newsletter_list_subscriber" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_send_campaign_sub_uidx" ON "marketing"."newsletter_send" USING btree ("campaign_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_send_campaign_idx" ON "marketing"."newsletter_send" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "newsletter_send_queue_campaign_status_idx" ON "marketing"."newsletter_send_queue" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_send_queue_campaign_sub_uidx" ON "marketing"."newsletter_send_queue" USING btree ("campaign_id","subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_email_uidx" ON "marketing"."newsletter_subscriber" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_token_uidx" ON "marketing"."newsletter_subscriber" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "newsletter_subscriber_status_idx" ON "marketing"."newsletter_subscriber" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_tag_uidx" ON "marketing"."newsletter_subscriber_tag" USING btree ("subscriber_id","tag_id");--> statement-breakpoint
CREATE INDEX "newsletter_subscriber_tag_tag_idx" ON "marketing"."newsletter_subscriber_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_tag_slug_uidx" ON "marketing"."newsletter_tag" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "webflow_blog_item_site_slug_uidx" ON "marketing"."webflow_blog_item" USING btree ("site_id","slug");--> statement-breakpoint
CREATE INDEX "webflow_blog_item_status_idx" ON "marketing"."webflow_blog_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webflow_blog_item_webflow_id_idx" ON "marketing"."webflow_blog_item" USING btree ("webflow_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webflow_sync_state_site_uidx" ON "marketing"."webflow_sync_state" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "youtube_cache_channel_fetched_idx" ON "marketing"."youtube_cache" USING btree ("channel_id","fetched_at");--> statement-breakpoint
CREATE INDEX "commercial_clients_prospect_idx" ON "mission"."commercial_clients" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "commercial_entreprises_prospect_idx" ON "mission"."commercial_entreprises" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "commercial_entreprises_nom_idx" ON "mission"."commercial_entreprises" USING btree ("nom_entreprise");--> statement-breakpoint
CREATE INDEX "mission_bc_revision_entity_idx" ON "mission"."mission_bc_revision" USING btree ("entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "mission_bv_revision_entity_idx" ON "mission"."mission_bv_revision" USING btree ("entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "mission_document_events_mission_idx" ON "mission"."mission_document_events" USING btree ("mission_id","changed_at");--> statement-breakpoint
CREATE INDEX "mission_document_events_bc_idx" ON "mission"."mission_document_events" USING btree ("bc_id");--> statement-breakpoint
CREATE INDEX "mission_fa_revision_entity_idx" ON "mission"."mission_fa_revision" USING btree ("entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "mission_fs_revision_entity_idx" ON "mission"."mission_fs_revision" USING btree ("entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "mission_pvrf_revision_entity_idx" ON "mission"."mission_pvrf_revision" USING btree ("entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "mission_qs_revision_entity_idx" ON "mission"."mission_qs_revision" USING btree ("entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "mission_rmi_revision_entity_idx" ON "mission"."mission_rmi_revision" USING btree ("entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "slack_user_groups_name_idx" ON "sg"."slack_user_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "slack_user_groups_last_refreshed_idx" ON "sg"."slack_user_groups" USING btree ("last_refreshed_at");--> statement-breakpoint
CREATE INDEX "registre_bdd_user_id_idx" ON "si_registres"."registre_bdd" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "registre_bdd_traitement_data_id_idx" ON "si_registres"."registre_bdd" USING btree ("traitement_data_id");--> statement-breakpoint
CREATE INDEX "registre_licences_user_id_idx" ON "si_registres"."registre_licences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "registre_licences_annee_civile_idx" ON "si_registres"."registre_licences" USING btree ("annee_civile");--> statement-breakpoint
CREATE INDEX "registre_rgpd_user_id_idx" ON "si_registres"."registre_rgpd" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "registre_rgpd_annee_civile_idx" ON "si_registres"."registre_rgpd" USING btree ("annee_civile");--> statement-breakpoint
CREATE INDEX "traitement_data_user_id_idx" ON "si_registres"."traitement_data" USING btree ("user_id");