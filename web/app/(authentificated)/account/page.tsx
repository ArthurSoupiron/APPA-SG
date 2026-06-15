import type { Metadata } from "next";

import AccountHubLoader from "./account-hub-loader";

export const metadata: Metadata = {
  title: "Compte",
};

export default function AccountPage() {
  return <AccountHubLoader />;
}
