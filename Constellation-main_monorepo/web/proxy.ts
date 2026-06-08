import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * En développement : journalise chaque requête entrante (méthode + chemin + query)
 * dans le terminal du processus Next (préfixé par concurrently : `{time} [web]`).
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const u = request.nextUrl;
    const q = u.searchParams.toString();
    const pathWithQuery = q ? `${u.pathname}?${q}` : u.pathname;
    console.log(`[next] ${request.method} ${pathWithQuery}`);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
