"use client";

import { UnifiedConnectButton } from "@/components/wallet/unified-connect-button";

export function ConnectWalletButton({ className }: { className?: string }) {
  return (
    <UnifiedConnectButton
      namespace="solana"
      className={className}
      label="Connect"
    />
  );
}
