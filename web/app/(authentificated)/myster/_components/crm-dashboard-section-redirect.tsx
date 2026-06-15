"use client";

import type { CrmSectionId } from "@myster/_components/crm-sections";
import { writeCrmProspectionSectionForRedirect } from "@myster/_lib/crm-prospection-storage";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export function CrmDashboardSectionRedirect({ section }: { section: CrmSectionId }) {
  const router = useRouter();

  useLayoutEffect(() => {
    writeCrmProspectionSectionForRedirect(section);
    router.replace("/myster/dashboard");
  }, [section, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
