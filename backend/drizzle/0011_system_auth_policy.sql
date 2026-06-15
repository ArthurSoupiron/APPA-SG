CREATE TABLE "ops"."system_auth_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"email_password_enabled" boolean DEFAULT true NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ops"."system_auth_policy" ADD CONSTRAINT "system_auth_policy_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "ops"."system_auth_policy" ("id", "email_password_enabled") VALUES ('default', true);
