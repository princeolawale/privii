import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageShell } from "@/components/layout/page-shell";

export default function DashboardPage() {
  return (
    <PageShell className="pt-2 sm:pt-6 lg:pt-8" largeLogo>
      <DashboardClient />
    </PageShell>
  );
}
