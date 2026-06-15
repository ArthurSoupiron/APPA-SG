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
CREATE INDEX "slack_user_groups_name_idx" ON "sg"."slack_user_groups" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "slack_user_groups_last_refreshed_idx" ON "sg"."slack_user_groups" USING btree ("last_refreshed_at");
--> statement-breakpoint
CREATE TABLE "mission"."gm_drive_template_tags" (
  "doc_type" text PRIMARY KEY NOT NULL,
  "drive_file_id" text NOT NULL,
  "drive_file_name" text NOT NULL,
  "tags" jsonb NOT NULL,
  "synced_at" timestamp DEFAULT now() NOT NULL
);
