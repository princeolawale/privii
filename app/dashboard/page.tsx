import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageShell } from "@/components/layout/page-shell";

export default function DashboardPage() {
  return (
    <PageShell className="pt-6 sm:pt-10" largeLogo>
      <DashboardClient />
    </PageShell>
  );
}
