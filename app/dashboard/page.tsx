import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageShell } from "@/components/layout/page-shell";

export default function DashboardPage() {
  return (
    <PageShell className="pt-0 sm:pt-1" largeLogo>
      <DashboardClient />
    </PageShell>
  );
}
