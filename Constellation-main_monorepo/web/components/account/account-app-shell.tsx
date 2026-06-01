"use client";

import { RedirectIfAnonymous } from "@/components/auth-guard";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UbacSessionProvider } from "@/lib/ubac-client";
import { SiTicketCreateProvider } from "@/app/(authentificated)/si/_components/si-ticket-create-provider";

import { AccountAppSidebar } from "./account-app-sidebar";
import { GlobalActivityBanner } from "./global-activity-banner";

export function AccountAppShell({ children }: { children: React.ReactNode }) {
  return (
    <RedirectIfAnonymous>
      <UbacSessionProvider>
        <SiTicketCreateProvider>
          <SidebarProvider defaultOpen className="jm-auth-shell h-svh overflow-hidden">
            <AccountAppSidebar />
            <SidebarInset className="jm-auth-content-bubble min-h-0 md:shadow-none md:peer-data-[variant=inset]:m-3 md:peer-data-[variant=inset]:ml-0">
              <GlobalActivityBanner />
              <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
                <SidebarTrigger aria-label="Ouvrir le menu" />
                <Separator orientation="vertical" className="h-4" />
                <div className="flex flex-1 items-center gap-2" />
              </header>

              <div className="jm-app-viewport" data-slot="jm-app-viewport">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </SiTicketCreateProvider>
      </UbacSessionProvider>
    </RedirectIfAnonymous>
  );
}
