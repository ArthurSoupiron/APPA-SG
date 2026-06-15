import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  SI_TICKET_STATUS_BADGE_CLASS,
  SI_TICKET_STATUS_LABELS,
} from "../_lib/si-ticket-status";
import type { SiTicketStatus } from "../_lib/si-ticket-types";

export function SiTicketStatusBadge({ status }: { status: SiTicketStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("whitespace-normal", SI_TICKET_STATUS_BADGE_CLASS[status])}
    >
      {SI_TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}
