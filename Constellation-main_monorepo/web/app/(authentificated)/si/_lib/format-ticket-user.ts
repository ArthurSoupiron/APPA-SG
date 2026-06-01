import type { SiTicketUser } from "./si-ticket-types";

export function formatTicketUser(
  u: SiTicketUser | null | undefined,
  options?: { emptyLabel?: string },
): string {
  if (!u) return options?.emptyLabel ?? "—";
  const name = u.name?.trim();
  if (name) return name;
  if (u.email) return u.email;
  return "—";
}
