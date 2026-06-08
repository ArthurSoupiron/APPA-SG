"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** Ligne renvoyée par `GET /api/app/ubac/users`. */
export type UbacAdminUserRow = {
  id: string;
  name: string;
  email: string;
  workspaceGroups: { id: string; email: string; name: string | null }[];
  groupPermissions: string[];
  effectivePermissions: string[];
  isSuperAdmin?: boolean;
};

type SessionJson = {
  permissions?: string[];
  isSuperAdmin?: boolean;
  user?: { id?: string };
};

type UbacSessionValue = {
  permissions: string[] | null;
  isSuperAdmin: boolean;
  userId: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
  hasPermission: (p: string) => boolean;
};

const UbacSessionContext = createContext<UbacSessionValue | null>(null);

/** Réponse récente (remontage React Strict Mode / double effet). */
let sessionSnapshot: { data: SessionJson | null; at: number } | null = null;
const SNAPSHOT_MS = 4000;

let sessionInFlight: Promise<SessionJson | null> | null = null;

async function loadSessionJson(invalidateSnapshot: boolean): Promise<SessionJson | null> {
  if (invalidateSnapshot) sessionSnapshot = null;

  const now = Date.now();
  if (!invalidateSnapshot && sessionSnapshot && now - sessionSnapshot.at < SNAPSHOT_MS) {
    return sessionSnapshot.data;
  }

  if (sessionInFlight) return sessionInFlight;

  sessionInFlight = (async () => {
    try {
      const res = await fetch("/session", { credentials: "include" });
      if (!res.ok) return null;
      return (await res.json()) as SessionJson;
    } catch {
      return null;
    } finally {
      sessionInFlight = null;
    }
  })();

  const data = await sessionInFlight;
  sessionSnapshot = { data, at: Date.now() };
  return data;
}

/**
 * Une seule requête `GET /session` pour toute l’app authentifiée (sidebar + pages).
 * Déduplique les appels concurrents et les remontages Strict Mode (cache court).
 */
export function UbacSessionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyJson = useCallback((json: SessionJson | null) => {
    if (!json) {
      setPermissions(null);
      setIsSuperAdmin(false);
      setUserId(null);
    } else {
      setPermissions(json.permissions ?? []);
      setIsSuperAdmin(Boolean(json.isSuperAdmin));
      setUserId(typeof json.user?.id === "string" ? json.user.id : null);
    }
  }, []);

  const refetch = useCallback(
    async (invalidate = true) => {
      setLoading(true);
      const json = await loadSessionJson(invalidate);
      applyJson(json);
      setLoading(false);
    },
    [applyJson],
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refetch(false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [refetch]);

  const hasPermission = useCallback(
    (p: string) => {
      if (isSuperAdmin) return true;
      return permissions?.includes(p) ?? false;
    },
    [permissions, isSuperAdmin],
  );

  const value = useMemo(
    () => ({
      permissions,
      isSuperAdmin,
      userId,
      loading,
      refetch: () => refetch(true),
      hasPermission,
    }),
    [permissions, isSuperAdmin, userId, loading, refetch, hasPermission],
  );

  return <UbacSessionContext.Provider value={value}>{children}</UbacSessionContext.Provider>;
}

/**
 * `GET /session` via `UbacSessionProvider` (requêtes mutualisées).
 */
export function useUbacSession(): UbacSessionValue {
  const ctx = useContext(UbacSessionContext);
  if (!ctx) {
    throw new Error("useUbacSession doit être utilisé sous <UbacSessionProvider>");
  }
  return ctx;
}
