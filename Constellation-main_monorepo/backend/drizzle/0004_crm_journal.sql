CREATE TABLE "crm"."contact_event" (
	"id" text PRIMARY KEY NOT NULL,
	"prospect_id" text NOT NULL,
	"user_id" text,
	"kind" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_event_kind_check" CHECK ("kind" IN ('appel', 'email', 'rdv', 'linkedin', 'autre'))
);
--> statement-breakpoint
CREATE TABLE "crm"."crm_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."prospect_note" (
	"id" text PRIMARY KEY NOT NULL,
	"prospect_id" text NOT NULL,
	"user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm"."contact_event" ADD CONSTRAINT "contact_event_prospect_id_prospect_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "crm"."prospect"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."contact_event" ADD CONSTRAINT "contact_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."crm_audit_log" ADD CONSTRAINT "crm_audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."prospect_note" ADD CONSTRAINT "prospect_note_prospect_id_prospect_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "crm"."prospect"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."prospect_note" ADD CONSTRAINT "prospect_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_event_prospect_created_idx" ON "crm"."contact_event" USING btree ("prospect_id","created_at");--> statement-breakpoint
CREATE INDEX "contact_event_user_idx" ON "crm"."contact_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "crm_audit_log_entity_created_idx" ON "crm"."crm_audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "crm_audit_log_user_idx" ON "crm"."crm_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prospect_note_prospect_created_idx" ON "crm"."prospect_note" USING btree ("prospect_id","created_at");--> statement-breakpoint
CREATE INDEX "prospect_note_user_idx" ON "crm"."prospect_note" USING btree ("user_id");