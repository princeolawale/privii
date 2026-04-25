import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageShell } from "@/components/layout/page-shell";

export default function DashboardPage() {
  return (
    <PageShell>
      <DashboardClient />
    </PageShell>
  );
}
