import { PageShell } from "@/components/layout/page-shell";
import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { PayLinkForm } from "@/components/create/paylink-form";

export default function CreatePage() {
  return (
    <PageShell>
      <div className="mb-6 flex justify-end">
        <ConnectWalletButton />
      </div>
      <PayLinkForm />
    </PageShell>
  );
}
