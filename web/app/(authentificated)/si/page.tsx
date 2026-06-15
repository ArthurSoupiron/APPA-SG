import type { Metadata } from "next";

import { AccountPageMain } from "@/components/account/account-page-main";

import { SiHub } from "./_components/si-hub";

export const metadata: Metadata = {
  title: "SI",
};

export default function SiPage() {
  return (
    <AccountPageMain className="flex min-h-0 flex-1 flex-col">
      <SiHub />
    </AccountPageMain>
  );
}
