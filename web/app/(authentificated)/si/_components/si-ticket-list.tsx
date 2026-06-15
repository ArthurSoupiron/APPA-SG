"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatTicketUser } from "../_lib/format-ticket-user";
import type { SiTicketListItem } from "../_lib/si-ticket-types";
import { SI_TICKET_CATEGORY_LABELS } from "../_lib/si-ticket-status";
import { SiTicketStatusBadge } from "./si-ticket-status-badge";

export function SiTicketList(props: {
  tickets: SiTicketListItem[];
  showAssignee?: boolean;
  showCreator?: boolean;
  onSelect: (id: string) => void;
}) {
  if (props.tickets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Aucun ticket trouvé.</p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Type</TableHead>
            {props.showCreator ? <TableHead>Demandeur</TableHead> : null}
            {props.showAssignee ? <TableHead>Assigné à</TableHead> : null}
            <TableHead>Mis à jour</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.tickets.map((t) => (
            <TableRow
              key={t.id}
              className="cursor-pointer"
              onClick={() => props.onSelect(t.id)}
            >
              <TableCell className="font-mono text-xs">{t.reference}</TableCell>
              <TableCell className="whitespace-normal break-words">{t.title}</TableCell>
              <TableCell>
                <SiTicketStatusBadge status={t.status} />
              </TableCell>
              <TableCell>{SI_TICKET_CATEGORY_LABELS[t.category]}</TableCell>
              {props.showCreator ? (
                <TableCell className="whitespace-normal break-words text-sm">
                  {formatTicketUser(t.creator)}
                </TableCell>
              ) : null}
              {props.showAssignee ? (
                <TableCell className="whitespace-normal break-words text-sm">
                  {formatTicketUser(t.assignee, { emptyLabel: "Non assigné" })}
                </TableCell>
              ) : null}
              <TableCell className="text-xs text-muted-foreground">
                {new Date(t.updatedAt).toLocaleString("fr-FR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
