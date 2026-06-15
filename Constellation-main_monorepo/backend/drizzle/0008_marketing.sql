CREATE SCHEMA IF NOT EXISTS "marketing";
--> statement-breakpoint
CREATE TABLE "marketing"."linkedin_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"synced_by_user_id" text
);
--> statement-breakpoint
CREATE INDEX "linkedin_cache_org_fetched_idx" ON "marketing"."linkedin_cache" USING btree ("organization_id","fetched_at");
--> statement-breakpoint
CREATE TABLE "marketing"."youtube_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"synced_by_user_id" text
);
--> statement-breakpoint
CREATE INDEX "youtube_cache_channel_fetched_idx" ON "marketing"."youtube_cache" USING btree ("channel_id","fetched_at");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"first_name" text,
	"last_name" text,
	"unsubscribe_token" text NOT NULL,
	"global_unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_email_uidx" ON "marketing"."newsletter_subscriber" USING btree ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_token_uidx" ON "marketing"."newsletter_subscriber" USING btree ("unsubscribe_token");
--> statement-breakpoint
CREATE INDEX "newsletter_subscriber_status_idx" ON "marketing"."newsletter_subscriber" USING btree ("status");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"legal_basis" text DEFAULT 'consent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_tag_slug_uidx" ON "marketing"."newsletter_tag" USING btree ("slug");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_subscriber_tag" (
	"subscriber_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_tag_uidx" ON "marketing"."newsletter_subscriber_tag" USING btree ("subscriber_id","tag_id");
--> statement-breakpoint
CREATE INDEX "newsletter_subscriber_tag_tag_idx" ON "marketing"."newsletter_subscriber_tag" USING btree ("tag_id");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_list" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "newsletter_list_name_idx" ON "marketing"."newsletter_list" USING btree ("name");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_list_subscriber" (
	"list_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_list_subscriber_uidx" ON "marketing"."newsletter_list_subscriber" USING btree ("list_id","subscriber_id");
--> statement-breakpoint
CREATE INDEX "newsletter_list_subscriber_sub_idx" ON "marketing"."newsletter_list_subscriber" USING btree ("subscriber_id");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_consent_log" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text NOT NULL,
	"mode" text NOT NULL,
	"source" text NOT NULL,
	"consent_text" text NOT NULL,
	"legal_basis" text,
	"ip_hash" text,
	"user_agent" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "newsletter_consent_log_sub_idx" ON "marketing"."newsletter_consent_log" USING btree ("subscriber_id");
--> statement-breakpoint
CREATE INDEX "newsletter_consent_log_recorded_idx" ON "marketing"."newsletter_consent_log" USING btree ("recorded_at");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"preheader" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"template_key" text,
	"public_view_token" text NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"footer_html" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_view_token_uidx" ON "marketing"."newsletter_campaign" USING btree ("public_view_token");
--> statement-breakpoint
CREATE INDEX "newsletter_campaign_status_idx" ON "marketing"."newsletter_campaign" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "newsletter_campaign_scheduled_idx" ON "marketing"."newsletter_campaign" USING btree ("scheduled_at");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_block" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"block_type" text NOT NULL,
	"content" jsonb NOT NULL,
	"track_id" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "newsletter_block_campaign_idx" ON "marketing"."newsletter_block" USING btree ("campaign_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_block_track_uidx" ON "marketing"."newsletter_block" USING btree ("campaign_id","track_id");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_campaign_tag" (
	"campaign_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_tag_uidx" ON "marketing"."newsletter_campaign_tag" USING btree ("campaign_id","tag_id");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_campaign_list" (
	"campaign_id" text NOT NULL,
	"list_id" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_list_uidx" ON "marketing"."newsletter_campaign_list" USING btree ("campaign_id","list_id");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_send_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "newsletter_send_queue_campaign_status_idx" ON "marketing"."newsletter_send_queue" USING btree ("campaign_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_send_queue_campaign_sub_uidx" ON "marketing"."newsletter_send_queue" USING btree ("campaign_id","subscriber_id");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_send" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"message_id" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_send_campaign_sub_uidx" ON "marketing"."newsletter_send" USING btree ("campaign_id","subscriber_id");
--> statement-breakpoint
CREATE INDEX "newsletter_send_campaign_idx" ON "marketing"."newsletter_send" USING btree ("campaign_id");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_event" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text,
	"send_id" text,
	"event_type" text NOT NULL,
	"block_track_id" text,
	"link_url" text,
	"ip_hash" text,
	"user_agent" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "newsletter_event_campaign_type_idx" ON "marketing"."newsletter_event" USING btree ("campaign_id","event_type");
--> statement-breakpoint
CREATE INDEX "newsletter_event_block_idx" ON "marketing"."newsletter_event" USING btree ("campaign_id","block_track_id");
--> statement-breakpoint
CREATE INDEX "newsletter_event_occurred_idx" ON "marketing"."newsletter_event" USING btree ("occurred_at");
--> statement-breakpoint
CREATE TABLE "marketing"."newsletter_confirm_token" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_confirm_token_token_uidx" ON "marketing"."newsletter_confirm_token" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "newsletter_confirm_token_sub_idx" ON "marketing"."newsletter_confirm_token" USING btree ("subscriber_id");
--> statement-breakpoint
CREATE TABLE "marketing"."webflow_sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"collection_id" text,
	"collection_slug" text DEFAULT 'blog' NOT NULL,
	"last_synced_at" timestamp,
	"meta" jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX "webflow_sync_state_site_uidx" ON "marketing"."webflow_sync_state" USING btree ("site_id");
--> statement-breakpoint
CREATE TABLE "marketing"."webflow_blog_item" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"webflow_item_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text DEFAULT '' NOT NULL,
	"author" text,
	"image_url" text,
	"meta_title" text,
	"meta_description" text,
	"categories" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"is_draft" boolean DEFAULT true NOT NULL,
	"field_data" jsonb,
	"last_synced_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "webflow_blog_item_site_slug_uidx" ON "marketing"."webflow_blog_item" USING btree ("site_id","slug");
--> statement-breakpoint
CREATE INDEX "webflow_blog_item_status_idx" ON "marketing"."webflow_blog_item" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "webflow_blog_item_webflow_id_idx" ON "marketing"."webflow_blog_item" USING btree ("webflow_item_id");
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_subscriber_tag" ADD CONSTRAINT "newsletter_subscriber_tag_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_subscriber_tag" ADD CONSTRAINT "newsletter_subscriber_tag_tag_id_newsletter_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "marketing"."newsletter_tag"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_list_subscriber" ADD CONSTRAINT "newsletter_list_subscriber_list_id_newsletter_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "marketing"."newsletter_list"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_list_subscriber" ADD CONSTRAINT "newsletter_list_subscriber_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_consent_log" ADD CONSTRAINT "newsletter_consent_log_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign" ADD CONSTRAINT "newsletter_campaign_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_block" ADD CONSTRAINT "newsletter_block_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_tag" ADD CONSTRAINT "newsletter_campaign_tag_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_tag" ADD CONSTRAINT "newsletter_campaign_tag_tag_id_newsletter_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "marketing"."newsletter_tag"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_list" ADD CONSTRAINT "newsletter_campaign_list_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_campaign_list" ADD CONSTRAINT "newsletter_campaign_list_list_id_newsletter_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "marketing"."newsletter_list"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send_queue" ADD CONSTRAINT "newsletter_send_queue_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send_queue" ADD CONSTRAINT "newsletter_send_queue_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send" ADD CONSTRAINT "newsletter_send_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_send" ADD CONSTRAINT "newsletter_send_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_event" ADD CONSTRAINT "newsletter_event_campaign_id_newsletter_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."newsletter_campaign"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_event" ADD CONSTRAINT "newsletter_event_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_event" ADD CONSTRAINT "newsletter_event_send_id_newsletter_send_id_fk" FOREIGN KEY ("send_id") REFERENCES "marketing"."newsletter_send"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."newsletter_confirm_token" ADD CONSTRAINT "newsletter_confirm_token_subscriber_id_newsletter_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "marketing"."newsletter_subscriber"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "marketing"."webflow_blog_item" ADD CONSTRAINT "webflow_blog_item_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
