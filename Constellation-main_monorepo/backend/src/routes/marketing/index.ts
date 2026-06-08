import type { Hono } from "hono";
import { Hono as HonoBase } from "hono";

import type { AppVariables } from "../../types/app";
import { registerMarketingLinkedInRoutes } from "./linkedin";
import { registerMarketingNewsletterAdminRoutes } from "./newsletter-admin";
import { registerMarketingNewsletterPublicRoutes } from "./newsletter-public";
import { registerMarketingWebflowRoutes } from "./webflow";
import { registerMarketingYouTubeRoutes } from "./youtube";

/** Marketing : LinkedIn, YouTube, newsletter, Webflow blog. */
export function registerMarketingRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerMarketingLinkedInRoutes(app);
  registerMarketingYouTubeRoutes(app);
  registerMarketingNewsletterAdminRoutes(app);
  registerMarketingNewsletterPublicRoutes(app as unknown as HonoBase);
  registerMarketingWebflowRoutes(app);
}
