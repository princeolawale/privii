import { GetStartedFlow } from "@/components/get-started/get-started-flow";
import { PageShell } from "@/components/layout/page-shell";

export default function GetStartedPage() {
  return (
    <PageShell className="flex items-start pt-4 sm:pt-8 lg:pt-10">
      <GetStartedFlow />
    </PageShell>
  );
}
