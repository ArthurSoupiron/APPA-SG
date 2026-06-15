"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SI_TICKET_STATUS_LABELS, SI_TICKET_STATUSES } from "../_lib/si-ticket-status";

export function SiTicketFilters(props: {
  q: string;
  onQChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Rechercher (référence, titre…)"
        value={props.q}
        onChange={(e) => props.onQChange(e.target.value)}
        className="sm:max-w-xs"
      />
      <Select value={props.status || "all"} onValueChange={(v) => props.onStatusChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {SI_TICKET_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {SI_TICKET_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
