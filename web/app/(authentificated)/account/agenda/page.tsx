import { redirect } from "next/navigation";

export default async function AccountAgendaRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const params = await searchParams;
  const q = params.event ? `?event=${encodeURIComponent(params.event)}` : "";
  redirect(`/dashboard${q}`);
}
