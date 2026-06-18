CREATE SCHEMA IF NOT EXISTS "assoc";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assoc"."conformite_check" (
	"id" text PRIMARY KEY NOT NULL,
	"k" text NOT NULL,
	"s" text DEFAULT '' NOT NULL,
	"state" text DEFAULT 'todo' NOT NULL,
	"ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assoc"."deadline" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"title" text NOT NULL,
	"sub" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assoc"."document" (
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
CREATE TABLE IF NOT EXISTS "assoc"."member" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "assoc_member_email_unique" ON "assoc"."member" USING btree ("email");
