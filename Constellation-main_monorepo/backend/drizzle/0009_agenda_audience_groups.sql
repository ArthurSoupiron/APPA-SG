CREATE TABLE "agenda"."event_audience_group" (
	"event_id" text NOT NULL,
	"workspace_group_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_audience_group_event_id_workspace_group_id_pk" PRIMARY KEY("event_id","workspace_group_id")
);
--> statement-breakpoint
CREATE INDEX "event_audience_group_group_idx" ON "agenda"."event_audience_group" USING btree ("workspace_group_id");
--> statement-breakpoint
ALTER TABLE "agenda"."event_audience_group" ADD CONSTRAINT "event_audience_group_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "agenda"."event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda"."event_audience_group" ADD CONSTRAINT "event_audience_group_workspace_group_id_workspace_group_id_fk" FOREIGN KEY ("workspace_group_id") REFERENCES "gw"."workspace_group"("id") ON DELETE cascade ON UPDATE no action;
