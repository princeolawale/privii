import { PageShell } from "@/components/layout/page-shell";
import { PayLinkPaymentClient } from "@/components/pay/paylink-payment-client";

export default async function TagPayPage({
  params
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  return (
    <PageShell
      className="flex items-start pt-6 sm:pt-10"
      hideWalletButton
      largeLogo
    >
      <PayLinkPaymentClient tag={tag} />
    </PageShell>
  );
}
