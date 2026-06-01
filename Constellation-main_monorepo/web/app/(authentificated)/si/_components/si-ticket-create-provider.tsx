"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { SiTicketDetail } from "../_lib/si-ticket-types";
import { SiTicketCreateDialog } from "./si-ticket-create-dialog";

type OnCreatedListener = (detail: SiTicketDetail) => void;

type SiTicketCreateContextValue = {
  openCreateTicket: () => void;
  registerOnCreated: (listener: OnCreatedListener) => () => void;
};

const SiTicketCreateContext = createContext<SiTicketCreateContextValue | null>(null);

export function SiTicketCreateProvider(props: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const listenersRef = useRef(new Set<OnCreatedListener>());

  const openCreateTicket = useCallback(() => setOpen(true), []);

  const registerOnCreated = useCallback((listener: OnCreatedListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const onCreated = useCallback((detail: SiTicketDetail) => {
    toast.success(`Ticket ${detail.ticket.reference} créé`);
    for (const listener of listenersRef.current) {
      listener(detail);
    }
  }, []);

  return (
    <SiTicketCreateContext.Provider value={{ openCreateTicket, registerOnCreated }}>
      {props.children}
      <SiTicketCreateDialog open={open} onOpenChange={setOpen} onCreated={onCreated} />
    </SiTicketCreateContext.Provider>
  );
}

export function useSiTicketCreate() {
  const ctx = useContext(SiTicketCreateContext);
  if (!ctx) {
    throw new Error("useSiTicketCreate doit être utilisé sous <SiTicketCreateProvider>");
  }
  return ctx;
}

/** Enregistre un callback après création (ex. ouvrir la fiche sur /si). */
export function useSiTicketOnCreated(listener: OnCreatedListener) {
  const { registerOnCreated } = useSiTicketCreate();
  useEffect(() => registerOnCreated(listener), [registerOnCreated, listener]);
}
