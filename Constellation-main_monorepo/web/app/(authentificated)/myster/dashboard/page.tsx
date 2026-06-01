import DashboardLoader from "./dashboard-loader";

/** Garde d’accès : `myster/layout.tsx` (`assertBackendAccess` sur `CRM_APP_ENTRY_PERMISSIONS`). */
export default function CrmDashboardPage() {
  return <DashboardLoader />;
}
