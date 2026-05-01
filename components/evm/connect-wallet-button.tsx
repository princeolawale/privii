"use client";

import { UnifiedConnectButton } from "@/components/wallet/unified-connect-button";

export function EvmConnectWalletButton({ className }: { className?: string }) {
  return (
    <UnifiedConnectButton
      namespace="eip155"
      className={className}
      label="Connect"
    />
  );
}
