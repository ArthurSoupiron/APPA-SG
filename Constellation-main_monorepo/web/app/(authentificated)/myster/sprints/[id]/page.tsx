"use client";

import { persistCrmSprintDetailIntent } from "@myster/_lib/crm-prospection-storage";
import { useParams, useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function CrmSprintDetailBridgePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useLayoutEffect(() => {
    if (!id) return;
    persistCrmSprintDetailIntent(id);
    router.replace("/myster/dashboard");
  }, [id, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
