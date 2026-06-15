import { AccountPageMain } from "@/components/account/account-page-main";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-2xl bg-muted/50 px-3.5 py-3">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </>
  );
}

export default function AccountLoading() {
  return (
    <AccountPageMain className="py-8">
      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-16 rounded-3xl" />
            </div>
            <Skeleton className="h-3.5 w-48" />
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="mx-3.5 h-3.5 w-12" />
            <div className="flex flex-col gap-2.5">
              <SkeletonRows count={5} />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Skeleton className="mx-3.5 h-3.5 w-28" />
            <div className="flex flex-col gap-2.5">
              <SkeletonRows count={4} />
            </div>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-wrap gap-3 pt-6">
          <Skeleton className="h-9 w-36 rounded-4xl" />
          <Skeleton className="h-9 w-44 rounded-4xl" />
        </CardFooter>
      </Card>
    </AccountPageMain>
  );
}
