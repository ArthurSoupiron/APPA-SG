import { index, integer, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { marketingSchema } from "../schemas";

export const NEWSLETTER_SUBSCRIBER_STATUSES = [
  "pending",
  "active",
  "unsubscribed",
  "bounced",
] as const;
export type NewsletterSubscriberStatus = (typeof NEWSLETTER_SUBSCRIBER_STATUSES)[number];

export const NEWSLETTER_CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "cancelled",
] as const;
export type NewsletterCampaignStatus = (typeof NEWSLETTER_CAMPAIGN_STATUSES)[number];

export const NEWSLETTER_LEGAL_BASES = [
  "consent",
  "contract",
  "legitimate_interest",
] as const;
export type NewsletterLegalBasis = (typeof NEWSLETTER_LEGAL_BASES)[number];

export const newsletterSubscriber = marketingSchema.table(
  "newsletter_subscriber",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    status: text("status").$type<NewsletterSubscriberStatus>().notNull().default("pending"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    unsubscribeToken: text("unsubscribe_token").notNull(),
    globalUnsubscribedAt: timestamp("global_unsubscribed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("newsletter_subscriber_email_uidx").on(t.email),
    uniqueIndex("newsletter_subscriber_token_uidx").on(t.unsubscribeToken),
    index("newsletter_subscriber_status_idx").on(t.status),
  ],
);

export const newsletterTag = marketingSchema.table(
  "newsletter_tag",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    legalBasis: text("legal_basis").$type<NewsletterLegalBasis>().notNull().default("consent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("newsletter_tag_slug_uidx").on(t.slug)],
);

export const newsletterSubscriberTag = marketingSchema.table(
  "newsletter_subscriber_tag",
  {
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscriber.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => newsletterTag.id, { onDelete: "cascade" }),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
  },
  (t) => [
    uniqueIndex("newsletter_subscriber_tag_uidx").on(t.subscriberId, t.tagId),
    index("newsletter_subscriber_tag_tag_idx").on(t.tagId),
  ],
);

export const newsletterList = marketingSchema.table(
  "newsletter_list",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("newsletter_list_name_idx").on(t.name)],
);

export const newsletterListSubscriber = marketingSchema.table(
  "newsletter_list_subscriber",
  {
    listId: text("list_id")
      .notNull()
      .references(() => newsletterList.id, { onDelete: "cascade" }),
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscriber.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("newsletter_list_subscriber_uidx").on(t.listId, t.subscriberId),
    index("newsletter_list_subscriber_sub_idx").on(t.subscriberId),
  ],
);

export const newsletterConsentLog = marketingSchema.table(
  "newsletter_consent_log",
  {
    id: text("id").primaryKey(),
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscriber.id, { onDelete: "cascade" }),
    mode: text("mode").notNull(),
    source: text("source").notNull(),
    consentText: text("consent_text").notNull(),
    legalBasis: text("legal_basis").$type<NewsletterLegalBasis>(),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (t) => [
    index("newsletter_consent_log_sub_idx").on(t.subscriberId),
    index("newsletter_consent_log_recorded_idx").on(t.recordedAt),
  ],
);

export const newsletterCampaign = marketingSchema.table(
  "newsletter_campaign",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    preheader: text("preheader"),
    status: text("status").$type<NewsletterCampaignStatus>().notNull().default("draft"),
    templateKey: text("template_key"),
    publicViewToken: text("public_view_token").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    footerHtml: text("footer_html"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("newsletter_campaign_view_token_uidx").on(t.publicViewToken),
    index("newsletter_campaign_status_idx").on(t.status),
    index("newsletter_campaign_scheduled_idx").on(t.scheduledAt),
  ],
);

export const newsletterBlock = marketingSchema.table(
  "newsletter_block",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => newsletterCampaign.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    blockType: text("block_type").notNull(),
    content: jsonb("content").notNull(),
    trackId: text("track_id").notNull(),
  },
  (t) => [
    index("newsletter_block_campaign_idx").on(t.campaignId),
    uniqueIndex("newsletter_block_track_uidx").on(t.campaignId, t.trackId),
  ],
);

export const newsletterCampaignTag = marketingSchema.table(
  "newsletter_campaign_tag",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => newsletterCampaign.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => newsletterTag.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("newsletter_campaign_tag_uidx").on(t.campaignId, t.tagId)],
);

export const newsletterCampaignList = marketingSchema.table(
  "newsletter_campaign_list",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => newsletterCampaign.id, { onDelete: "cascade" }),
    listId: text("list_id")
      .notNull()
      .references(() => newsletterList.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("newsletter_campaign_list_uidx").on(t.campaignId, t.listId)],
);

export const newsletterSendQueue = marketingSchema.table(
  "newsletter_send_queue",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => newsletterCampaign.id, { onDelete: "cascade" }),
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscriber.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
    sentAt: timestamp("sent_at"),
  },
  (t) => [
    index("newsletter_send_queue_campaign_status_idx").on(t.campaignId, t.status),
    uniqueIndex("newsletter_send_queue_campaign_sub_uidx").on(t.campaignId, t.subscriberId),
  ],
);

export const newsletterSend = marketingSchema.table(
  "newsletter_send",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => newsletterCampaign.id, { onDelete: "cascade" }),
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscriber.id, { onDelete: "cascade" }),
    messageId: text("message_id"),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("newsletter_send_campaign_sub_uidx").on(t.campaignId, t.subscriberId),
    index("newsletter_send_campaign_idx").on(t.campaignId),
  ],
);

export const NEWSLETTER_EVENT_TYPES = ["open", "click"] as const;
export type NewsletterEventType = (typeof NEWSLETTER_EVENT_TYPES)[number];

export const newsletterEvent = marketingSchema.table(
  "newsletter_event",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => newsletterCampaign.id, { onDelete: "cascade" }),
    subscriberId: text("subscriber_id").references(() => newsletterSubscriber.id, {
      onDelete: "set null",
    }),
    sendId: text("send_id").references(() => newsletterSend.id, { onDelete: "set null" }),
    eventType: text("event_type").$type<NewsletterEventType>().notNull(),
    blockTrackId: text("block_track_id"),
    linkUrl: text("link_url"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  },
  (t) => [
    index("newsletter_event_campaign_type_idx").on(t.campaignId, t.eventType),
    index("newsletter_event_block_idx").on(t.campaignId, t.blockTrackId),
    index("newsletter_event_occurred_idx").on(t.occurredAt),
  ],
);

export const newsletterConfirmToken = marketingSchema.table(
  "newsletter_confirm_token",
  {
    id: text("id").primaryKey(),
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscriber.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
  },
  (t) => [
    uniqueIndex("newsletter_confirm_token_token_uidx").on(t.token),
    index("newsletter_confirm_token_sub_idx").on(t.subscriberId),
  ],
);
