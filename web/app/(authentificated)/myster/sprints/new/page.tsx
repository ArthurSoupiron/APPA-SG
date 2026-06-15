"use client";

import { persistCrmNewSprintIntent } from "@myster/_lib/crm-prospection-storage";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function CrmNewSprintBridgePage() {
  const router = useRouter();

  useLayoutEffect(() => {
    persistCrmNewSprintIntent();
    router.replace("/myster/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
