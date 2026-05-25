import { PageShell } from "@/components/layout/page-shell";
import { PayLinkForm } from "@/components/create/paylink-form";

export default function CreatePage() {
  return (
    <PageShell className="flex items-start pt-4 sm:pt-8 lg:pt-10">
      <PayLinkForm />
    </PageShell>
  );
}
