import { Suspense } from "react";
import type { Metadata } from "next";

import { Spinner } from "@/components/ui/spinner";

import { AgendaEventsView } from "./_components/agenda-events-view";

export const metadata: Metadata = {
  title: "Agenda",
};

export default function AccountAgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <AgendaEventsView />
    </Suspense>
  );
}
