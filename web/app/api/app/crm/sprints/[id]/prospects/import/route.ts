import { proxyPostMultipartToBackend } from "@/lib/proxy-backend-request";

export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyPostMultipartToBackend(
    request,
    `/api/app/crm/sprints/${encodeURIComponent(id)}/prospects/import`,
  );
}
