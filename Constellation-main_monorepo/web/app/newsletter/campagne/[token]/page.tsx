import { headers } from "next/headers";

type Props = { params: Promise<{ token: string }> };

export default async function NewsletterCampaignViewPage({ params }: Props) {
  const { token } = await params;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = process.env.NEXT_PUBLIC_AUTH_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  const res = await fetch(`${base}/api/public/newsletter/campaigns/view/${token}`, {
    cache: "no-store",
  });
  const html = res.ok ? await res.text() : "<p>Campagne introuvable.</p>";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
