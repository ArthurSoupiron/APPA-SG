"use client";

import {
  Briefcase01Icon,
  Building05Icon,
  Calendar01Icon,
  CloudDownloadIcon,
  ComputerProgramming01Icon,
  DriveIcon,
  Home09Icon,
  KanbanIcon,
  Logout01Icon,
  Megaphone01Icon,
  MoneyBag01Icon,
  Notification01Icon,
  Settings01Icon,
  Shield01Icon,
  Ticket01Icon,
  UserGroup02Icon,
  UserListIcon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { JaegerMysterBrand } from "@/components/jaeger-myster-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSiTicketCreate } from "@/app/(authentificated)/si/_components/si-ticket-create-provider";
import { authClient } from "@/lib/auth-client";
import { useUbacSession } from "@/lib/ubac-client";
import { cn } from "@/lib/utils";

import {
  ACCOUNT_NAV_SECTIONS,
  type NavIconKey,
  SUPERADMIN_NAV_SECTION,
} from "./account-nav-config";

const EXACT_MATCH_NAV_HREFS = new Set(["/dashboard", "/account"]);

const NAV_ICONS: Record<NavIconKey, React.ComponentType<{ className?: string }>> = {
  dashboard: (p) => <HugeiconsIcon icon={Home09Icon} strokeWidth={2} {...p} />,
  account: (p) => <HugeiconsIcon icon={UserSettings01Icon} strokeWidth={2} {...p} />,
  agenda: (p) => <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} {...p} />,
  monDrive: (p) => <HugeiconsIcon icon={DriveIcon} strokeWidth={2} {...p} />,
  contacts: (p) => <HugeiconsIcon icon={UserListIcon} strokeWidth={2} {...p} />,
  activities: (p) => <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} {...p} />,
  shield: (p) => <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} {...p} />,
  workspace: (p) => <HugeiconsIcon icon={CloudDownloadIcon} strokeWidth={2} {...p} />,
  jaeger: (p) => <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} {...p} />,
  myster: (p) => <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} {...p} />,
  marketing: (p) => <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} {...p} />,
  cdm: (p) => <HugeiconsIcon icon={UserSettings01Icon} strokeWidth={2} {...p} />,
  rdi: (p) => <HugeiconsIcon icon={UserGroup02Icon} strokeWidth={2} {...p} />,
  sg: (p) => <HugeiconsIcon icon={Building05Icon} strokeWidth={2} {...p} />,
  tresorerie: (p) => <HugeiconsIcon icon={MoneyBag01Icon} strokeWidth={2} {...p} />,
  si: (p) => <HugeiconsIcon icon={ComputerProgramming01Icon} strokeWidth={2} {...p} />,
  actionPlan: (p) => <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} {...p} />,
};

function navItemTooltip(title: string, subtitle?: string) {
  if (!subtitle) return title;
  return `${title} — ${subtitle}`;
}

type PresenceStatus = "online" | "away" | "busy" | "offline";

const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  online: "En ligne",
  away: "Absent",
  busy: "Occupé",
  offline: "Hors ligne",
};

const PRESENCE_COLORS: Record<PresenceStatus, string> = {
  online: "bg-green-500",
  away: "bg-amber-400",
  busy: "bg-red-500",
  offline: "bg-muted-foreground",
};

const PRESENCE_STORAGE_KEY = "jaeger-presence";

function initials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "?";
}

function readStoredPresence(): PresenceStatus {
  try {
    const stored = sessionStorage.getItem(PRESENCE_STORAGE_KEY) as PresenceStatus | null;
    if (stored && stored in PRESENCE_LABELS) return stored;
  } catch {
    // sessionStorage peut être inaccessible (SSR, privé, etc.)
  }
  return "online";
}

function usePresence() {
  const [status, setStatusState] = useState<PresenceStatus>(readStoredPresence);

  function setStatus(next: PresenceStatus) {
    setStatusState(next);
    try {
      sessionStorage.setItem(PRESENCE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return { status, setStatus };
}

export function AccountAppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { hasPermission, loading: ubacLoading, isSuperAdmin } = useUbacSession();
  const { status, setStatus } = usePresence();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const { openCreateTicket } = useSiTicketCreate();

  const navSections = [
    ...ACCOUNT_NAV_SECTIONS,
    ...(isSuperAdmin && !ubacLoading ? [SUPERADMIN_NAV_SECTION] : []),
  ];

  const user = session?.user;
  const brandIconOnly = state === "collapsed" && !isMobile;

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <Sidebar side="left" variant="inset" collapsible="icon" className="md:p-0! md:pr-2">
      <SidebarHeader
        className={cn(
          "flex min-w-0 flex-row items-center gap-1 p-2",
          "group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2",
        )}
      >
        <SidebarMenu
          className={cn(
            "min-w-0 flex-1 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex-none",
            "group-data-[collapsible=icon]:items-center",
          )}
        >
          <SidebarMenuItem
            className={cn(
              "group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center",
            )}
          >
            {brandIconOnly ? (
              <SidebarMenuButton
                type="button"
                size="lg"
                tooltip="Agrandir la barre latérale"
                className={cn(
                  "data-[size=lg]:h-auto data-[size=lg]:py-2",
                  "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:text-center",
                )}
                onClick={() => toggleSidebar()}
              >
                <JaegerMysterBrand variant="compact" iconOnly />
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                type="button"
                size="lg"
                tooltip="Réduire la barre latérale"
                aria-label="Réduire la barre latérale — Constellation"
                className={cn(
                  "data-[size=lg]:h-auto data-[size=lg]:py-2",
                  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
                )}
                onClick={() => toggleSidebar()}
              >
                <span className="min-w-0 overflow-hidden">
                  <JaegerMysterBrand variant="compact" iconOnly={false} />
                </span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <div className="flex w-full min-w-0 shrink-0 justify-center">
        <SidebarSeparator />
      </div>

      {/* Navigation par section */}
      <SidebarContent>
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (ubacLoading) return false;
            if (item.permissionAnyOf?.length) {
              return item.permissionAnyOf.some((p) => hasPermission(p));
            }
            if (!item.permission) return true;
            return hasPermission(item.permission);
          });
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup
              key={section.label}
              className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-1"
            >
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (!EXACT_MATCH_NAV_HREFS.has(item.href) &&
                        pathname.startsWith(`${item.href}/`));
                    const Icon = item.iconKey ? NAV_ICONS[item.iconKey] : null;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          disabled={item.disabled}
                          tooltip={navItemTooltip(item.title, item.subtitle)}
                          className={cn(
                            "relative transition-[transform,background-color,color,box-shadow] duration-200 ease-out",
                            "before:absolute before:inset-y-1 before:left-1 before:w-1 before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity before:duration-200",
                            "hover:translate-x-0.5 hover:bg-sidebar-accent/80",
                            "data-[active=true]:translate-x-0.5 data-[active=true]:bg-sidebar-primary/12 data-[active=true]:text-sidebar-foreground",
                            "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border))]",
                            "data-[active=true]:before:opacity-100",
                            "group-data-[collapsible=icon]:hover:translate-x-0 group-data-[collapsible=icon]:data-[active=true]:translate-x-0 group-data-[collapsible=icon]:before:hidden",
                          )}
                        >
                          <Link
                            href={item.href}
                            aria-disabled={item.disabled}
                            tabIndex={item.disabled ? -1 : undefined}
                          >
                            {Icon && <Icon />}
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="whitespace-normal wrap-break-word leading-tight">
                                {item.title}
                              </span>
                              {item.subtitle ? (
                                <span className="text-sidebar-foreground/65 whitespace-normal wrap-break-word text-xs font-normal leading-snug">
                                  {item.subtitle}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <div className="flex w-full min-w-0 shrink-0 justify-center">
        <SidebarSeparator />
      </div>

      {/* Footer : profil + présence + actions */}
      <SidebarFooter className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        {user ? (
          <>
            {/* Bloc profil avec présence */}
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      tooltip={user.name ?? user.email}
                      className="data-[size=lg]:h-auto data-[size=lg]:py-2 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-8">
                          {user.image && (
                            <AvatarImage src={user.image} alt={user.name ?? user.email} />
                          )}
                          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <AvatarBadge
                          className={cn("size-2.5 ring-sidebar", PRESENCE_COLORS[status])}
                          aria-label={`Présence : ${PRESENCE_LABELS[status]}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                        <div className="truncate text-sm font-medium leading-tight">
                          {user.name ?? user.email}
                        </div>
                        {user.name && (
                          <div className="text-sidebar-foreground/60 truncate text-xs">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="min-w-48">
                    <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                      Présence
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={status}
                      onValueChange={(v) => setStatus(v as PresenceStatus)}
                    >
                      {(Object.keys(PRESENCE_LABELS) as PresenceStatus[]).map((key) => (
                        <DropdownMenuRadioItem key={key} value={key}>
                          <span
                            className={cn(
                              "mr-2 inline-block size-2 rounded-full",
                              PRESENCE_COLORS[key],
                            )}
                            aria-hidden
                          />
                          {PRESENCE_LABELS[key]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="flex items-center justify-around gap-1 group-data-[collapsible=icon]:flex-col">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Nouveau ticket SI"
                    className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary"
                    onClick={() => openCreateTicket()}
                  >
                    <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Nouveau ticket SI</TooltipContent>
              </Tooltip>

              <ThemeToggle className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Réglages"
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  >
                    <Link href="/account/settings">
                      <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Réglages</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Notifications"
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    onClick={() => toast.info("Pas de nouvelles notifications.")}
                  >
                    <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Notifications</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Se déconnecter"
                    className="text-sidebar-foreground/70 hover:text-destructive"
                    onClick={() => void handleSignOut()}
                  >
                    <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Se déconnecter</TooltipContent>
              </Tooltip>
            </div>
          </>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
