import { AccountPageMain } from "@/components/account/account-page-main";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <AccountPageMain className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex shrink-0 gap-4 border-b border-border pb-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-4 pt-2 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </AccountPageMain>
  );
}
