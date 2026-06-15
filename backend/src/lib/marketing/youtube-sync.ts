import { desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { youtubeCache } from "../../db/schema";
import { getGoogleOAuthForUser } from "../google-account-auth";
import { getMarketingEnv, isMarketingIntegrationConfigured } from "./marketing-env";

export type YouTubeSyncResult =
  | { ok: true; cacheId: string; fetchedAt: string; fromCache?: boolean }
  | { ok: false; error: string; code: string };

export async function getLatestYouTubeCache(channelId: string) {
  const [row] = await db
    .select()
    .from(youtubeCache)
    .where(eq(youtubeCache.channelId, channelId))
    .orderBy(desc(youtubeCache.fetchedAt))
    .limit(1);
  return row ?? null;
}

export async function syncYouTube(
  channelId: string,
  userId: string,
  force = false,
): Promise<YouTubeSyncResult> {
  if (!isMarketingIntegrationConfigured("youtube")) {
    return {
      ok: false,
      error: "YouTube non configuré (YOUTUBE_CHANNEL_ID).",
      code: "not_configured",
    };
  }

  const env = getMarketingEnv();
  const chId = channelId || env.youtubeChannelId;

  if (!force) {
    const latest = await getLatestYouTubeCache(chId);
    if (latest && Date.now() - latest.fetchedAt.getTime() < env.cacheTtlMs) {
      return {
        ok: true,
        cacheId: latest.id,
        fetchedAt: latest.fetchedAt.toISOString(),
        fromCache: true,
      };
    }
  }

  const google = await getGoogleOAuthForUser(userId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!google.ok) {
    const latest = await getLatestYouTubeCache(chId);
    if (latest) {
      return {
        ok: true,
        cacheId: latest.id,
        fetchedAt: latest.fetchedAt.toISOString(),
        fromCache: true,
      };
    }
    return { ok: false, error: google.message, code: "google_auth" };
  }

  try {
    const { google: googleApis } = await import("googleapis");
    const youtube = googleApis.youtube({ version: "v3", auth: google.auth });
    const ytAnalytics = googleApis.youtubeAnalytics({ version: "v2", auth: google.auth });

    const channelRes = await youtube.channels.list({
      part: ["snippet", "statistics", "contentDetails"],
      id: [chId],
    });

    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);

    let analytics: unknown = null;
    try {
      const analyticsRes = await ytAnalytics.reports.query({
        ids: `channel==${chId}`,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        metrics: "views,estimatedMinutesWatched,subscribersGained,averageViewDuration",
        dimensions: "day",
        sort: "day",
      });
      analytics = analyticsRes.data;
    } catch {
      analytics = { error: "analytics_unavailable" };
    }

    const playlistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    let recentVideos: unknown = null;
    if (playlistId) {
      const pl = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId,
        maxResults: 25,
      });
      recentVideos = pl.data;
    }

    const payload = {
      channelId: chId,
      channel: channelRes.data,
      analytics,
      recentVideos,
      syncedAt: new Date().toISOString(),
    };

    const id = Bun.randomUUIDv7();
    const fetchedAt = new Date();
    await db.insert(youtubeCache).values({
      id,
      channelId: chId,
      payload,
      fetchedAt,
      syncedByUserId: userId,
    });
    return { ok: true, cacheId: id, fetchedAt: fetchedAt.toISOString() };
  } catch (e) {
    const latest = await getLatestYouTubeCache(chId);
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
      error: e instanceof Error ? e.message : "Erreur sync YouTube",
      code: "sync_failed",
    };
  }
}
