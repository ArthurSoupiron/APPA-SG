CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "crm";
--> statement-breakpoint
CREATE SCHEMA "sg";
--> statement-breakpoint
CREATE SCHEMA "si";
--> statement-breakpoint
CREATE SCHEMA "ubac";
--> statement-breakpoint
CREATE TABLE "auth"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ubac"."app_role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_role_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ubac"."app_role_permission" (
	"role_id" text NOT NULL,
	"permission" text NOT NULL,
	CONSTRAINT "app_role_permission_role_id_permission_pk" PRIMARY KEY("role_id","permission")
);
--> statement-breakpoint
CREATE TABLE "ubac"."user_app_role" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "user_app_role_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "crm"."prospect" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"prenom" text,
	"email" text,
	"telephone" text,
	"linkedin" text,
	"entreprise" text,
	"secteur" text,
	"source" text,
	"statut" text DEFAULT 'a_contacter' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."prospect_status_log" (
	"id" text PRIMARY KEY NOT NULL,
	"prospect_id" text NOT NULL,
	"user_id" text,
	"old_status" text,
	"new_status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."crm_sprint" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"theme" text,
	"date_start" timestamp NOT NULL,
	"date_end" timestamp NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."sprint_member" (
	"sprint_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sprint_member_sprint_id_user_id_pk" PRIMARY KEY("sprint_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "crm"."sprint_prospect" (
	"sprint_id" text NOT NULL,
	"prospect_id" text NOT NULL,
	"assigned_user_id" text,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sprint_prospect_sprint_id_prospect_id_pk" PRIMARY KEY("sprint_id","prospect_id")
);
--> statement-breakpoint
CREATE TABLE "si"."google_drive_item" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"drive_file_id" text NOT NULL,
	"name" text,
	"mime_type" text,
	"web_view_link" text,
	"parent_folder_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sg"."slack_workspace_binding" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"team_name" text,
	"bot_user_id" text,
	"installed_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slack_workspace_binding_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "sg"."slack_user_binding" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slack_user_id" text NOT NULL,
	"slack_team_id" text NOT NULL,
	"slack_display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ubac"."app_role_permission" ADD CONSTRAINT "app_role_permission_role_id_app_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "ubac"."app_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ubac"."user_app_role" ADD CONSTRAINT "user_app_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ubac"."user_app_role" ADD CONSTRAINT "user_app_role_role_id_app_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "ubac"."app_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."prospect" ADD CONSTRAINT "prospect_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."prospect_status_log" ADD CONSTRAINT "prospect_status_log_prospect_id_prospect_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "crm"."prospect"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."prospect_status_log" ADD CONSTRAINT "prospect_status_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."crm_sprint" ADD CONSTRAINT "crm_sprint_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."sprint_member" ADD CONSTRAINT "sprint_member_sprint_id_crm_sprint_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "crm"."crm_sprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."sprint_member" ADD CONSTRAINT "sprint_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."sprint_prospect" ADD CONSTRAINT "sprint_prospect_sprint_id_crm_sprint_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "crm"."crm_sprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."sprint_prospect" ADD CONSTRAINT "sprint_prospect_prospect_id_prospect_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "crm"."prospect"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."sprint_prospect" ADD CONSTRAINT "sprint_prospect_assigned_user_id_user_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."google_drive_item" ADD CONSTRAINT "google_drive_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sg"."slack_workspace_binding" ADD CONSTRAINT "slack_workspace_binding_installed_by_user_id_user_id_fk" FOREIGN KEY ("installed_by_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sg"."slack_user_binding" ADD CONSTRAINT "slack_user_binding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "auth"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "auth"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "auth"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "user_app_role_user_id_idx" ON "ubac"."user_app_role" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prospect_statut_idx" ON "crm"."prospect" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "prospect_created_by_idx" ON "crm"."prospect" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "prospect_updated_at_idx" ON "crm"."prospect" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "psl_prospect_idx" ON "crm"."prospect_status_log" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "psl_user_idx" ON "crm"."prospect_status_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "psl_created_at_idx" ON "crm"."prospect_status_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "crm_sprint_created_by_idx" ON "crm"."crm_sprint" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "crm_sprint_dates_idx" ON "crm"."crm_sprint" USING btree ("date_start","date_end");--> statement-breakpoint
CREATE INDEX "sprint_prospect_sprint_idx" ON "crm"."sprint_prospect" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "sprint_prospect_user_idx" ON "crm"."sprint_prospect" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "gdi_user_idx" ON "si"."google_drive_item" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gdi_drive_file_idx" ON "si"."google_drive_item" USING btree ("drive_file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gdi_user_drive_file_unique" ON "si"."google_drive_item" USING btree ("user_id","drive_file_id");--> statement-breakpoint
CREATE INDEX "swb_installer_idx" ON "sg"."slack_workspace_binding" USING btree ("installed_by_user_id");--> statement-breakpoint
CREATE INDEX "sub_slack_user_idx" ON "sg"."slack_user_binding" USING btree ("slack_user_id");--> statement-breakpoint
CREATE INDEX "sub_team_idx" ON "sg"."slack_user_binding" USING btree ("slack_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_user_team_unique" ON "sg"."slack_user_binding" USING btree ("user_id","slack_team_id");