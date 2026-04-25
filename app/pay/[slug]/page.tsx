import { PageShell } from "@/components/layout/page-shell";
import { PayLinkPaymentClient } from "@/components/pay/paylink-payment-client";

export default async function PayPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PageShell className="flex items-center">
      <PayLinkPaymentClient slug={slug} />
    </PageShell>
  );
}
