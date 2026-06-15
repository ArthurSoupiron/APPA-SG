export function getMarketingEnv() {
  const cacheTtlHours = Number.parseInt(process.env.MARKETING_CACHE_TTL_HOURS ?? "24", 10);
  return {
    linkedinOrganizationId: process.env.LINKEDIN_ORGANIZATION_ID?.trim() ?? "",
    linkedinAccessToken: process.env.LINKEDIN_ACCESS_TOKEN?.trim() ?? "",
    youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID?.trim() ?? "",
    webflowSiteId: process.env.WEBFLOW_SITE_ID?.trim() ?? "",
    webflowApiToken: process.env.WEBFLOW_API_TOKEN?.trim() ?? "",
    webflowBlogCollectionSlug: process.env.WEBFLOW_BLOG_COLLECTION_SLUG?.trim() || "blog",
    newsletterPublicBaseUrl:
      process.env.NEWSLETTER_PUBLIC_BASE_URL?.trim() || "http://localhost:3000",
    cacheTtlMs: (Number.isFinite(cacheTtlHours) ? cacheTtlHours : 24) * 60 * 60 * 1000,
    smtp: {
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT ?? "587", 10),
      user: process.env.SMTP_USER?.trim() ?? "",
      pass: process.env.SMTP_PASS?.trim() ?? "",
      from: process.env.SMTP_FROM?.trim() ?? "",
      fromName: process.env.SMTP_FROM_NAME?.trim() || "JaegerMyster",
      batchSize: Number.parseInt(process.env.SMTP_BATCH_SIZE ?? "50", 10),
      batchDelayMs: Number.parseInt(process.env.SMTP_BATCH_DELAY_MS ?? "60000", 10),
    },
  };
}

export function isMarketingIntegrationConfigured(
  key: "linkedin" | "youtube" | "webflow" | "smtp",
): boolean {
  const env = getMarketingEnv();
  switch (key) {
    case "linkedin":
      return Boolean(env.linkedinOrganizationId && env.linkedinAccessToken);
    case "youtube":
      return Boolean(env.youtubeChannelId);
    case "webflow":
      return Boolean(env.webflowSiteId && env.webflowApiToken);
    case "smtp":
      return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass && env.smtp.from);
  }
}
