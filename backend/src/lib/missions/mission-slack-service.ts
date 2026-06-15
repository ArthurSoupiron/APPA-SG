import { WebClient } from "@slack/web-api";

type SlackApiResult = { ok: boolean; error?: string; [k: string]: unknown };

function getSlackToken(): string | undefined {
  return (
    process.env.SLACK_USER_BOT_TOKEN?.trim() || process.env.SLACK_BOT_TOKEN?.trim()
  );
}

function getSlackClient(): WebClient | null {
  const token = getSlackToken();
  if (!token) return null;
  return new WebClient(token);
}

export function normalizeSlackChannelName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export type SlackCoreChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
  isArchived: boolean;
};

export async function listSlackWorkspaceChannelsCore(): Promise<{
  success: boolean;
  channels: SlackCoreChannel[];
  error?: string;
}> {
  const client = getSlackClient();
  if (!client) {
    return { success: false, channels: [], error: "Token Slack non configuré." };
  }
  const channels: SlackCoreChannel[] = [];
  try {
    let cursor: string | undefined;
    do {
      const data = (await client.conversations.list({
        types: "public_channel,private_channel",
        limit: 200,
        exclude_archived: false,
        cursor,
      })) as SlackApiResult & {
        channels?: Array<{
          id: string;
          name: string;
          is_private?: boolean;
          is_archived?: boolean;
        }>;
        response_metadata?: { next_cursor?: string };
      };
      if (!data.ok) {
        return {
          success: false,
          channels: [],
          error: (data.error as string) ?? "Erreur API Slack",
        };
      }
      for (const ch of data.channels ?? []) {
        channels.push({
          id: ch.id,
          name: ch.name,
          isPrivate: !!ch.is_private,
          isArchived: !!ch.is_archived,
        });
      }
      cursor = data.response_metadata?.next_cursor?.trim() || undefined;
    } while (cursor);
    return { success: true, channels };
  } catch (e) {
    return {
      success: false,
      channels: [],
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function createSlackChannelWithVisibilityCore(
  name: string,
  isPrivate: boolean,
): Promise<{
  success: boolean;
  channelId?: string;
  channelName?: string;
  error?: string;
}> {
  const client = getSlackClient();
  if (!client) return { success: false, error: "Token Slack non configuré." };
  const cleanName = normalizeSlackChannelName(name);
  if (!cleanName) return { success: false, error: "Nom canal invalide." };
  try {
    const data = (await client.conversations.create({
      name: cleanName,
      is_private: isPrivate,
    })) as SlackApiResult & { channel?: { id?: string; name?: string } };
    if (!data.ok) {
      return { success: false, error: (data.error as string) ?? "Erreur API" };
    }
    return {
      success: true,
      channelId: data.channel?.id,
      channelName: data.channel?.name,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function listSlackUserGroupMembersCore(
  userGroupId: string,
): Promise<{ success: boolean; userIds: string[]; error?: string }> {
  const client = getSlackClient();
  if (!client) {
    return { success: false, userIds: [], error: "Token Slack non configuré." };
  }
  try {
    const data = (await client.usergroups.users.list({
      usergroup: userGroupId,
      include_disabled: false,
    })) as SlackApiResult & { users?: string[] };
    if (!data.ok) {
      return {
        success: false,
        userIds: [],
        error: (data.error as string) ?? "Erreur API",
      };
    }
    return { success: true, userIds: data.users ?? [] };
  } catch (e) {
    return {
      success: false,
      userIds: [],
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function inviteUsersToSlackChannelCore(
  channelId: string,
  userIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const client = getSlackClient();
  if (!client) return { success: false, error: "Token Slack non configuré." };
  if (userIds.length === 0) return { success: true };
  try {
    const data = (await client.conversations.invite({
      channel: channelId,
      users: userIds.join(","),
    })) as SlackApiResult;
    if (!data.ok) {
      return { success: false, error: (data.error as string) ?? "Erreur API" };
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function renameSlackChannelCore(
  channelId: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  const client = getSlackClient();
  if (!client) return { success: false, error: "Token Slack non configuré." };
  const cleanName = normalizeSlackChannelName(name);
  if (!cleanName) return { success: false, error: "Nom canal invalide." };
  try {
    const data = (await client.conversations.rename({
      channel: channelId,
      name: cleanName,
    })) as SlackApiResult;
    if (!data.ok) {
      return { success: false, error: (data.error as string) ?? "Erreur API" };
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function postSlackMessageCore(
  channelId: string,
  text: string,
): Promise<{ success: boolean; ts?: string; error?: string }> {
  const client = getSlackClient();
  if (!client) return { success: false, error: "Token Slack non configuré." };
  if (!channelId) return { success: false, error: "Canal Slack invalide." };
  if (!text.trim()) return { success: false, error: "Message vide." };
  try {
    const data = (await client.chat.postMessage({
      channel: channelId,
      text,
      mrkdwn: true,
    })) as SlackApiResult & { ts?: string };
    if (!data.ok) {
      return { success: false, error: (data.error as string) ?? "Erreur API" };
    }
    return { success: true, ts: data.ts };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function pinSlackMessageCore(
  channelId: string,
  ts: string,
): Promise<{ success: boolean; error?: string }> {
  const client = getSlackClient();
  if (!client) return { success: false, error: "Token Slack non configuré." };
  if (!channelId || !ts) return { success: false, error: "Paramètres de pin invalides." };
  try {
    const data = (await client.pins.add({ channel: channelId, timestamp: ts })) as SlackApiResult;
    if (!data.ok) {
      return { success: false, error: (data.error as string) ?? "Erreur API" };
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function getSlackChannelStateCore(channelId: string): Promise<{
  success: boolean;
  exists: boolean;
  verifiable: boolean;
  error?: string;
}> {
  const client = getSlackClient();
  if (!client) {
    return {
      success: false,
      exists: false,
      verifiable: false,
      error: "Token Slack non configuré.",
    };
  }
  if (!channelId) return { success: true, exists: false, verifiable: true };
  try {
    const data = (await client.conversations.info({
      channel: channelId,
      include_num_members: false,
    })) as SlackApiResult;
    if (data.ok) return { success: true, exists: true, verifiable: true };
    const error = (data.error as string) ?? "Erreur API";
    if (error === "channel_not_found") {
      return { success: true, exists: false, verifiable: true, error };
    }
    return { success: false, exists: false, verifiable: false, error };
  } catch (e) {
    return {
      success: false,
      exists: false,
      verifiable: false,
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}
