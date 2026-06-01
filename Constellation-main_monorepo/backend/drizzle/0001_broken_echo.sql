CREATE SCHEMA "gw";
--> statement-breakpoint
CREATE SCHEMA "ops";
--> statement-breakpoint
CREATE TABLE "gw"."workspace_group" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"description" text,
	"etag" text,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_group_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "gw"."workspace_group_member" (
	"id" text PRIMARY KEY NOT NULL,
	"container_group_id" text NOT NULL,
	"member_kind" text NOT NULL,
	"member_user_email" text,
	"member_nested_group_id" text,
	"user_id" text,
	CONSTRAINT "workspace_group_member_kind_check" CHECK (( "gw"."workspace_group_member"."member_kind" = 'user' AND "gw"."workspace_group_member"."member_user_email" IS NOT NULL AND "gw"."workspace_group_member"."member_nested_group_id" IS NULL ) OR ( "gw"."workspace_group_member"."member_kind" = 'group' AND "gw"."workspace_group_member"."member_nested_group_id" IS NOT NULL AND "gw"."workspace_group_member"."member_user_email" IS NULL ))
);
--> statement-breakpoint
CREATE TABLE "gw"."workspace_group_app_role" (
	"workspace_group_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "workspace_group_app_role_workspace_group_id_role_id_pk" PRIMARY KEY("workspace_group_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "ops"."async_job" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"progress" integer,
	"label" text,
	"detail" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"error" text,
	"created_by" text,
	"visible_to_all" boolean DEFAULT false NOT NULL,
	CONSTRAINT "async_job_status_check" CHECK ("ops"."async_job"."status" IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
	CONSTRAINT "async_job_progress_check" CHECK ("ops"."async_job"."progress" IS NULL OR ("ops"."async_job"."progress" >= 0 AND "ops"."async_job"."progress" <= 100))
);
--> statement-breakpoint
CREATE TABLE "ops"."system_banner" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"severity" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_banner_severity_check" CHECK ("ops"."system_banner"."severity" IN ('info', 'warning', 'critical'))
);
--> statement-breakpoint
ALTER TABLE "gw"."workspace_group_member" ADD CONSTRAINT "workspace_group_member_container_group_id_workspace_group_id_fk" FOREIGN KEY ("container_group_id") REFERENCES "gw"."workspace_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gw"."workspace_group_member" ADD CONSTRAINT "workspace_group_member_member_nested_group_id_workspace_group_id_fk" FOREIGN KEY ("member_nested_group_id") REFERENCES "gw"."workspace_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gw"."workspace_group_member" ADD CONSTRAINT "workspace_group_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gw"."workspace_group_app_role" ADD CONSTRAINT "workspace_group_app_role_workspace_group_id_workspace_group_id_fk" FOREIGN KEY ("workspace_group_id") REFERENCES "gw"."workspace_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gw"."workspace_group_app_role" ADD CONSTRAINT "workspace_group_app_role_role_id_app_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "ubac"."app_role"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops"."async_job" ADD CONSTRAINT "async_job_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops"."system_banner" ADD CONSTRAINT "system_banner_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wg_email_idx" ON "gw"."workspace_group" USING btree ("email");--> statement-breakpoint
CREATE INDEX "wgm_container_idx" ON "gw"."workspace_group_member" USING btree ("container_group_id");--> statement-breakpoint
CREATE INDEX "wgm_user_email_idx" ON "gw"."workspace_group_member" USING btree ("member_user_email");--> statement-breakpoint
CREATE INDEX "wgm_nested_group_idx" ON "gw"."workspace_group_member" USING btree ("member_nested_group_id");--> statement-breakpoint
CREATE INDEX "wgar_role_idx" ON "gw"."workspace_group_app_role" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "async_job_status_idx" ON "ops"."async_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "async_job_kind_idx" ON "ops"."async_job" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "system_banner_active_idx" ON "ops"."system_banner" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "system_banner_starts_idx" ON "ops"."system_banner" USING btree ("starts_at");