import { proxyPostMultipartToBackend } from "@/lib/proxy-backend-request";

export const maxDuration = 300;

export async function POST(request: Request) {
  return proxyPostMultipartToBackend(request, "/api/app/crm/prospects/import");
}
