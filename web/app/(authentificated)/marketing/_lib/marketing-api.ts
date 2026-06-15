async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(err.error ?? err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function marketingFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/app/marketing${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  return parseJson<T>(res);
}

export async function marketingPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return marketingFetch<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function marketingPatch<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return marketingFetch<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function marketingDelete<T>(path: string): Promise<T> {
  return marketingFetch<T>(path, { method: "DELETE" });
}
