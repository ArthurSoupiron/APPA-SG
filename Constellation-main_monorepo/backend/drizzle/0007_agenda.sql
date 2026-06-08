CREATE SCHEMA IF NOT EXISTS "agenda";
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
CREATE UNIQUE INDEX "event_type_pole_slug_unique" ON "agenda"."event_type" USING btree ("pole","slug");
--> statement-breakpoint
CREATE INDEX "event_type_pole_active_idx" ON "agenda"."event_type" USING btree ("pole","is_active");
--> statement-breakpoint
CREATE TABLE "agenda"."event_reference_seq" (
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "event_reference_seq_year_month_pk" PRIMARY KEY("year","month")
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
CREATE UNIQUE INDEX "event_reference_unique" ON "agenda"."event" USING btree ("reference");
--> statement-breakpoint
CREATE INDEX "event_pole_starts_idx" ON "agenda"."event" USING btree ("pole","starts_at");
--> statement-breakpoint
CREATE INDEX "event_status_starts_idx" ON "agenda"."event" USING btree ("status","starts_at");
--> statement-breakpoint
CREATE INDEX "event_created_by_idx" ON "agenda"."event" USING btree ("created_by_user_id");
--> statement-breakpoint
CREATE INDEX "event_recurrence_parent_idx" ON "agenda"."event" USING btree ("recurrence_parent_id");
--> statement-breakpoint
CREATE TABLE "agenda"."event_audience" (
	"event_id" text NOT NULL,
	"audience" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_audience_event_id_audience_pk" PRIMARY KEY("event_id","audience"),
	CONSTRAINT "event_audience_check" CHECK ("agenda"."event_audience"."audience" IN ('mandat', 'intervenants', 'externes'))
);
--> statement-breakpoint
CREATE INDEX "event_audience_audience_idx" ON "agenda"."event_audience" USING btree ("audience");
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
CREATE UNIQUE INDEX "event_participant_event_email_unique" ON "agenda"."event_participant" USING btree ("event_id","email");
--> statement-breakpoint
CREATE INDEX "event_participant_event_idx" ON "agenda"."event_participant" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX "event_participant_user_idx" ON "agenda"."event_participant" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "agenda"."event_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_comment_event_idx" ON "agenda"."event_comment" USING btree ("event_id","created_at");
--> statement-breakpoint
CREATE INDEX "event_comment_user_idx" ON "agenda"."event_comment" USING btree ("user_id");
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
CREATE INDEX "event_change_log_event_idx" ON "agenda"."event_change_log" USING btree ("event_id","created_at");
--> statement-breakpoint
CREATE INDEX "event_change_log_action_idx" ON "agenda"."event_change_log" USING btree ("action");
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
CREATE INDEX "event_notification_user_read_idx" ON "agenda"."event_notification" USING btree ("user_id","read_at");
--> statement-breakpoint
CREATE INDEX "event_notification_event_idx" ON "agenda"."event_notification" USING btree ("event_id");
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
ALTER TABLE "agenda"."event" ADD CONSTRAINT "event_type_id_event_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "agenda"."event_type"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event" ADD CONSTRAINT "event_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event" ADD CONSTRAINT "event_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_audience" ADD CONSTRAINT "event_audience_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_participant" ADD CONSTRAINT "event_participant_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_participant" ADD CONSTRAINT "event_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_comment" ADD CONSTRAINT "event_comment_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_comment" ADD CONSTRAINT "event_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_change_log" ADD CONSTRAINT "event_change_log_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_change_log" ADD CONSTRAINT "event_change_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_notification" ADD CONSTRAINT "event_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_notification" ADD CONSTRAINT "event_notification_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."user_calendar_sync" ADD CONSTRAINT "user_calendar_sync_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
