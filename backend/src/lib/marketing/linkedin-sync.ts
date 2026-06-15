import { desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { linkedinCache } from "../../db/schema";
import { getMarketingEnv, isMarketingIntegrationConfigured } from "./marketing-env";

export type LinkedInSyncResult =
  | { ok: true; cacheId: string; fetchedAt: string; fromCache?: boolean }
  | { ok: false; error: string; code: string };

async function fetchLinkedInMetrics(organizationId: string, accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": "202405",
  };

  const orgUrn = organizationId.startsWith("urn:")
    ? organizationId
    : `urn:li:organization:${organizationId}`;

  const followerRes = await fetch(
    `https://api.linkedin.com/rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`,
    { headers },
  );

  let followerStats: unknown = null;
  if (followerRes.ok) {
    followerStats = await followerRes.json();
  }

  const pageRes = await fetch(
    `https://api.linkedin.com/rest/organizations/${organizationId.replace(/\D/g, "")}`,
    { headers },
  );

  let organization: unknown = null;
  if (pageRes.ok) {
    organization = await pageRes.json();
  }

  return {
    organizationId,
    organization,
    followerStats,
    followerStatus: followerRes.status,
    pageStatus: pageRes.status,
    syncedAt: new Date().toISOString(),
  };
}

export async function getLatestLinkedInCache(organizationId: string) {
  const [row] = await db
    .select()
    .from(linkedinCache)
    .where(eq(linkedinCache.organizationId, organizationId))
    .orderBy(desc(linkedinCache.fetchedAt))
    .limit(1);
  return row ?? null;
}

export async function syncLinkedIn(
  organizationId: string,
  userId: string | null,
  force = false,
): Promise<LinkedInSyncResult> {
  if (!isMarketingIntegrationConfigured("linkedin")) {
    return {
      ok: false,
      error: "LinkedIn non configuré (LINKEDIN_ORGANIZATION_ID, LINKEDIN_ACCESS_TOKEN).",
      code: "not_configured",
    };
  }

  const env = getMarketingEnv();
  const orgId = organizationId || env.linkedinOrganizationId;

  if (!force) {
    const latest = await getLatestLinkedInCache(orgId);
    if (latest && Date.now() - latest.fetchedAt.getTime() < env.cacheTtlMs) {
      return {
        ok: true,
        cacheId: latest.id,
        fetchedAt: latest.fetchedAt.toISOString(),
        fromCache: true,
      };
    }
  }

  try {
    const payload = await fetchLinkedInMetrics(orgId, env.linkedinAccessToken);
    const id = Bun.randomUUIDv7();
    const fetchedAt = new Date();
    await db.insert(linkedinCache).values({
      id,
      organizationId: orgId,
      payload,
      fetchedAt,
      syncedByUserId: userId,
    });
    return { ok: true, cacheId: id, fetchedAt: fetchedAt.toISOString() };
  } catch (e) {
    const latest = await getLatestLinkedInCache(orgId);
    if (latest) {
      return {
        ok: true,
        cacheId: latest.id,
        fetchedAt: latest.fetchedAt.toISOString(),
        fromCache: true,
      };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur sync LinkedIn",
      code: "sync_failed",
    };
  }
}
