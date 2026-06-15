CREATE TABLE "ops"."app_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"payload" jsonb,
	"request_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si"."ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"category" text DEFAULT 'autre' NOT NULL,
	"creator_user_id" text NOT NULL,
	"assignee_user_id" text,
	"drive_folder_id" text,
	"drive_folder_url" text,
	"audit_snapshot" jsonb,
	"last_exported_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "ticket_status_check" CHECK ("si"."ticket"."status" IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
	CONSTRAINT "ticket_category_check" CHECK ("si"."ticket"."category" IN ('bug', 'acces', 'demande', 'autre'))
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"drive_file_id" text NOT NULL,
	"name" text NOT NULL,
	"mime_type" text,
	"web_view_link" text,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_label" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_label_assignment" (
	"ticket_id" text NOT NULL,
	"label_id" text NOT NULL,
	"assigned_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_label_assignment_ticket_id_label_id_pk" PRIMARY KEY("ticket_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ticket_id" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_reference_seq" (
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ticket_reference_seq_year_month_pk" PRIMARY KEY("year","month")
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_status_log" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"user_id" text,
	"from_status" text,
	"to_status" text NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "si"."ticket_watcher" (
	"ticket_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_watcher_ticket_id_user_id_pk" PRIMARY KEY("ticket_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "ops"."app_audit_log" ADD CONSTRAINT "app_audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket" ADD CONSTRAINT "ticket_creator_user_id_user_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket" ADD CONSTRAINT "ticket_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_attachment" ADD CONSTRAINT "ticket_attachment_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "si"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_attachment" ADD CONSTRAINT "ticket_attachment_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_comment" ADD CONSTRAINT "ticket_comment_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "si"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_comment" ADD CONSTRAINT "ticket_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_label_assignment" ADD CONSTRAINT "ticket_label_assignment_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "si"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_label_assignment" ADD CONSTRAINT "ticket_label_assignment_label_id_ticket_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "si"."ticket_label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_label_assignment" ADD CONSTRAINT "ticket_label_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_notification" ADD CONSTRAINT "ticket_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_notification" ADD CONSTRAINT "ticket_notification_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "si"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_status_log" ADD CONSTRAINT "ticket_status_log_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "si"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_status_log" ADD CONSTRAINT "ticket_status_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_watcher" ADD CONSTRAINT "ticket_watcher_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "si"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si"."ticket_watcher" ADD CONSTRAINT "ticket_watcher_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_audit_log_user_created_idx" ON "ops"."app_audit_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "app_audit_log_resource_idx" ON "ops"."app_audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_reference_unique" ON "si"."ticket" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "ticket_status_idx" ON "si"."ticket" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ticket_creator_idx" ON "si"."ticket" USING btree ("creator_user_id");--> statement-breakpoint
CREATE INDEX "ticket_assignee_idx" ON "si"."ticket" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE INDEX "ticket_created_at_idx" ON "si"."ticket" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ticket_attachment_ticket_idx" ON "si"."ticket_attachment" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_attachment_drive_file_unique" ON "si"."ticket_attachment" USING btree ("ticket_id","drive_file_id");--> statement-breakpoint
CREATE INDEX "ticket_comment_ticket_idx" ON "si"."ticket_comment" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_comment_user_idx" ON "si"."ticket_comment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_label_slug_unique" ON "si"."ticket_label" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ticket_label_assignment_label_idx" ON "si"."ticket_label_assignment" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "ticket_notification_user_read_idx" ON "si"."ticket_notification" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "ticket_notification_ticket_idx" ON "si"."ticket_notification" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_status_log_ticket_idx" ON "si"."ticket_status_log" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_status_log_user_idx" ON "si"."ticket_status_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ticket_watcher_user_idx" ON "si"."ticket_watcher" USING btree ("user_id");