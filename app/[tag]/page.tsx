import { PageShell } from "@/components/layout/page-shell";
import { PayLinkPaymentClient } from "@/components/pay/paylink-payment-client";

export default async function TagPayPage({
  params
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  return (
    <PageShell className="flex items-start pt-4 sm:pt-8 lg:pt-10" largeLogo>
      <PayLinkPaymentClient tag={tag} kind="tag" />
    </PageShell>
  );
}
