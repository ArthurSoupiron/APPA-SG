function backendBase(): string {
  return process.env.AUTH_BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";
}

/**
 * Relais multipart vers le backend (imports CRM).
 * Prioritaire sur les rewrites Next pour éviter ECONNRESET sur gros fichiers / requêtes longues.
 */
export async function proxyPostMultipartToBackend(
  request: Request,
  backendPath: string,
): Promise<Response> {
  const url = `${backendBase()}${backendPath}`;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit & { duplex?: "half" } = {
    method: "POST",
    headers,
    body: request.body,
    cache: "no-store",
    duplex: "half",
  };

  const res = await fetch(url, init);
  const outHeaders = new Headers();
  const resContentType = res.headers.get("content-type");
  if (resContentType) outHeaders.set("content-type", resContentType);

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: outHeaders,
  });
}
