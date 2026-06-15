"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { fetchSiNotifications, markSiNotificationsRead } from "../_lib/si-ticket-api";
import type { SiNotification } from "../_lib/si-ticket-types";

export function SiNotificationBell({ onOpenTicket }: { onOpenTicket: (ticketId: string) => void }) {
  const [items, setItems] = useState<SiNotification[]>([]);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setItems(await fetchSiNotifications());
  }, []);

  useEffect(() => {
    void reload();
    const t = setInterval(() => void reload(), 60_000);
    return () => clearInterval(t);
  }, [reload]);

  const unread = items.filter((n) => !n.readAt).length;

  async function markAllRead() {
    const ids = items.filter((n) => !n.readAt).map((n) => n.id);
    if (ids.length === 0) return;
    await markSiNotificationsRead(ids);
    await reload();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="relative">
          Notifications
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex max-h-80 flex-col">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Notifications SI</span>
            {unread > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void markAllRead()}>
                Tout marquer lu
              </Button>
            ) : null}
          </div>
          <ul className="overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted-foreground">Aucune notification.</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="border-b last:border-b-0">
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm whitespace-normal break-words hover:bg-muted/60",
                      !n.readAt && "bg-muted/30",
                    )}
                    onClick={() => {
                      void markSiNotificationsRead([n.id]);
                      setOpen(false);
                      onOpenTicket(n.ticketId);
                    }}
                  >
                    <span className="font-medium">{String(n.payload?.reference ?? n.kind)}</span>
                    <span className="mt-1 block text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
