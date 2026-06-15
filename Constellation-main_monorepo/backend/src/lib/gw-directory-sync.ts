import { and, eq, sql } from "drizzle-orm";
import type { admin_directory_v1 } from "googleapis";
import { google } from "googleapis";

import { db } from "../db";
import { account, asyncJob, workspaceGroup, workspaceGroupMember } from "../db/schema";

type DirectoryGroup = admin_directory_v1.Schema$Group;
type DirectoryMember = admin_directory_v1.Schema$Member;

export const GW_DIRECTORY_SYNC_KIND = "gw_directory_sync";

const DIRECTORY_SCOPES = [
  "https://www.googleapis.com/auth/admin.directory.group.readonly",
  "https://www.googleapis.com/auth/admin.directory.group.member.readonly",
] as const;

function scopeLikelyIncludesDirectory(scope: string | null | undefined): boolean {
  if (!scope?.trim()) return true;
  return DIRECTORY_SCOPES.every((s) => scope.includes(s));
}

function accessTokenStillValid(expiresAt: Date | null | undefined, bufferMs = 90_000): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() > Date.now() + bufferMs;
}

async function patchJob(
  jobId: string,
  patch: Partial<{
    status: string;
    progress: number | null;
    label: string | null;
    detail: Record<string, unknown> | null;
    finishedAt: Date | null;
    error: string | null;
  }>,
) {
  await db
    .update(asyncJob)
    .set(patch as never)
    .where(eq(asyncJob.id, jobId));
}

/** OAuth du super-admin : tokens stockés dans `auth.account` (provider `google`). */
async function getDirectoryAuth(
  adminUserId: string,
): Promise<
  { ok: true; auth: InstanceType<typeof google.auth.OAuth2> } | { ok: false; message: string }
> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants côté backend.",
    };
  }

  const [googleAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, adminUserId), eq(account.providerId, "google")))
    .limit(1);

  if (!googleAccount) {
    return {
      ok: false,
      message:
        "Aucun compte Google lié à cet utilisateur. Connectez-vous avec Google sur ce compte super-admin.",
    };
  }

  if (!scopeLikelyIncludesDirectory(googleAccount.scope)) {
    return {
      ok: false,
      message:
        "Compte Google sans scopes annuaire. Déconnectez-vous puis reconnectez-vous avec Google (scopes Directory côté serveur).",
    };
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);

  if (googleAccount.refreshToken) {
    oauth2.setCredentials({
      refresh_token: googleAccount.refreshToken,
      access_token: googleAccount.accessToken ?? undefined,
      expiry_date: googleAccount.accessTokenExpiresAt
        ? googleAccount.accessTokenExpiresAt.getTime()
        : undefined,
    });
    await oauth2.getAccessToken();
    return { ok: true, auth: oauth2 };
  }

  if (googleAccount.accessToken && accessTokenStillValid(googleAccount.accessTokenExpiresAt)) {
    oauth2.setCredentials({
      access_token: googleAccount.accessToken,
      expiry_date: googleAccount.accessTokenExpiresAt
        ? googleAccount.accessTokenExpiresAt.getTime()
        : undefined,
    });
    return { ok: true, auth: oauth2 };
  }

  return {
    ok: false,
    message:
      "Pas de jeton Google utilisable pour l’API Directory (refresh_token absent ou session expirée). Déconnectez-vous, révoquez l’accès à l’application dans https://myaccount.google.com/permissions si besoin, puis reconnectez-vous avec Google pour obtenir un refresh token (access_type offline + prompt consent côté serveur).",
  };
}

/**
 * Synchronise groupes + membres (API Directory) vers `gw.*`.
 * @param adminUserId utilisateur qui a lancé le job (super-admin) — tokens Google OAuth dans `auth.account`.
 */
export function startGwDirectorySyncJob(jobId: string, adminUserId: string): void {
  void (async () => {
    try {
      await patchJob(jobId, {
        status: "running",
        progress: 5,
        label: "Synchronisation Google Workspace (Directory API)",
        detail: { step: "authentification" },
      });

      const authRes = await getDirectoryAuth(adminUserId);
      if (!authRes.ok) {
        await patchJob(jobId, {
          status: "failed",
          progress: null,
          finishedAt: new Date(),
          error: authRes.message,
          detail: { step: "configuration" },
        });
        return;
      }

      const directory = google.admin({
        version: "directory_v1",
        auth: authRes.auth as InstanceType<typeof google.auth.OAuth2>,
      });

      await patchJob(jobId, {
        progress: 10,
        detail: { step: "liste des groupes" },
      });

      const groups: DirectoryGroup[] = [];
      let groupPage: string | undefined;
      do {
        const res = await directory.groups.list({
          customer: "my_customer",
          maxResults: 200,
          pageToken: groupPage,
        });
        groups.push(...(res.data.groups ?? []));
        groupPage = res.data.nextPageToken ?? undefined;
      } while (groupPage);

      await patchJob(jobId, {
        progress: 20,
        detail: { step: "écriture groupes", groupCount: groups.length },
      });

      const knownGroupIds = new Set(groups.map((g) => g.id).filter((x): x is string => Boolean(x)));

      const now = new Date();
      for (const g of groups) {
        const id = g.id;
        const email = g.email;
        if (!id || !email) continue;
        await db
          .insert(workspaceGroup)
          .values({
            id,
            email,
            name: g.name ?? null,
            description: g.description ?? null,
            etag: g.etag ?? null,
            syncedAt: now,
          })
          .onConflictDoUpdate({
            target: workspaceGroup.id,
            set: {
              email,
              name: g.name ?? null,
              description: g.description ?? null,
              etag: g.etag ?? null,
              syncedAt: now,
            },
          });
      }

      const total = Math.max(groups.length, 1);
      let idx = 0;
      for (const g of groups) {
        const gid = g.id;
        if (!gid) continue;
        idx += 1;
        const progress = 20 + Math.floor((75 * idx) / total);
        await patchJob(jobId, {
          progress,
          detail: {
            step: "membres",
            groupEmail: g.email,
            index: idx,
            total: groups.length,
          },
        });

        await db.delete(workspaceGroupMember).where(eq(workspaceGroupMember.containerGroupId, gid));

        const members: DirectoryMember[] = [];
        let memPage: string | undefined;
        do {
          const mres = await directory.members.list({
            groupKey: gid,
            maxResults: 200,
            pageToken: memPage,
          });
          members.push(...(mres.data.members ?? []));
          memPage = mres.data.nextPageToken ?? undefined;
        } while (memPage);

        const rows: (typeof workspaceGroupMember.$inferInsert)[] = [];
        for (const m of members) {
          const t = (m.type ?? "").toUpperCase();
          if (t === "USER") {
            const em = m.email;
            if (!em) continue;
            rows.push({
              id: crypto.randomUUID(),
              containerGroupId: gid,
              memberKind: "user",
              memberUserEmail: em,
              memberNestedGroupId: null,
              userId: null,
            });
          } else if (t === "GROUP") {
            const nestedId = m.id;
            if (!nestedId || !knownGroupIds.has(nestedId)) continue;
            rows.push({
              id: crypto.randomUUID(),
              containerGroupId: gid,
              memberKind: "group",
              memberUserEmail: null,
              memberNestedGroupId: nestedId,
              userId: null,
            });
          }
        }
        if (rows.length > 0) {
          await db.insert(workspaceGroupMember).values(rows);
        }
      }

      await db.execute(sql`
        UPDATE gw.workspace_group_member AS m
        SET user_id = u.id
        FROM auth.user AS u
        WHERE m.member_kind = 'user'
          AND m.member_user_email IS NOT NULL
          AND lower(m.member_user_email) = lower(u.email)
      `);

      await patchJob(jobId, {
        status: "succeeded",
        progress: 100,
        finishedAt: new Date(),
        detail: {
          step: "terminé",
          groupCount: groups.length,
        },
        error: null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await patchJob(jobId, {
        status: "failed",
        finishedAt: new Date(),
        error: msg,
        detail: { step: "erreur" },
      });
    }
  })();
}
