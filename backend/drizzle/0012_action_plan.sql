CREATE SCHEMA IF NOT EXISTS "action_plan";
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
CREATE INDEX "axis_sort_order_idx" ON "action_plan"."axis" USING btree ("sort_order");
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
CREATE INDEX "sub_axis_axis_id_idx" ON "action_plan"."sub_axis" USING btree ("axis_id");
--> statement-breakpoint
CREATE INDEX "sub_axis_sort_order_idx" ON "action_plan"."sub_axis" USING btree ("sort_order");
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
CREATE INDEX "smart_sub_axis_id_idx" ON "action_plan"."smart" USING btree ("sub_axis_id");
--> statement-breakpoint
CREATE INDEX "smart_sort_order_idx" ON "action_plan"."smart" USING btree ("sort_order");
--> statement-breakpoint
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
CREATE INDEX "action_smart_id_idx" ON "action_plan"."action" USING btree ("smart_id");
--> statement-breakpoint
CREATE INDEX "action_status_idx" ON "action_plan"."action" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "action_sort_order_idx" ON "action_plan"."action" USING btree ("sort_order");
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
CREATE INDEX "sub_action_action_id_idx" ON "action_plan"."sub_action" USING btree ("action_id");
--> statement-breakpoint
CREATE INDEX "sub_action_status_idx" ON "action_plan"."sub_action" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "sub_action_sort_order_idx" ON "action_plan"."sub_action" USING btree ("sort_order");
--> statement-breakpoint
CREATE TABLE "action_plan"."action_pole" (
	"action_id" text NOT NULL,
	"pole" text NOT NULL,
	CONSTRAINT "action_pole_action_id_pole_pk" PRIMARY KEY("action_id","pole"),
	CONSTRAINT "action_pole_check" CHECK ("action_plan"."action_pole"."pole" IN ('crm', 'marketing', 'rh', 'tresorerie', 'si', 'operations', 'presidence', 'erp', 'academy', 'rfp'))
);
--> statement-breakpoint
CREATE INDEX "action_pole_pole_idx" ON "action_plan"."action_pole" USING btree ("pole");
--> statement-breakpoint
CREATE TABLE "action_plan"."sub_action_pole" (
	"sub_action_id" text NOT NULL,
	"pole" text NOT NULL,
	CONSTRAINT "sub_action_pole_sub_action_id_pole_pk" PRIMARY KEY("sub_action_id","pole"),
	CONSTRAINT "sub_action_pole_check" CHECK ("action_plan"."sub_action_pole"."pole" IN ('crm', 'marketing', 'rh', 'tresorerie', 'si', 'operations', 'presidence', 'erp', 'academy', 'rfp'))
);
--> statement-breakpoint
CREATE INDEX "sub_action_pole_pole_idx" ON "action_plan"."sub_action_pole" USING btree ("pole");
--> statement-breakpoint
ALTER TABLE "action_plan"."sub_axis" ADD CONSTRAINT "sub_axis_axis_id_axis_id_fk" FOREIGN KEY ("axis_id") REFERENCES "action_plan"."axis"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "action_plan"."smart" ADD CONSTRAINT "smart_sub_axis_id_sub_axis_id_fk" FOREIGN KEY ("sub_axis_id") REFERENCES "action_plan"."sub_axis"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "action_plan"."action" ADD CONSTRAINT "action_smart_id_smart_id_fk" FOREIGN KEY ("smart_id") REFERENCES "action_plan"."smart"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "action_plan"."sub_action" ADD CONSTRAINT "sub_action_action_id_action_id_fk" FOREIGN KEY ("action_id") REFERENCES "action_plan"."action"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "action_plan"."action_pole" ADD CONSTRAINT "action_pole_action_id_action_id_fk" FOREIGN KEY ("action_id") REFERENCES "action_plan"."action"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "action_plan"."sub_action_pole" ADD CONSTRAINT "sub_action_pole_sub_action_id_sub_action_id_fk" FOREIGN KEY ("sub_action_id") REFERENCES "action_plan"."sub_action"("id") ON DELETE cascade ON UPDATE no action;
