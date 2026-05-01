"use client";

import { UnifiedConnectButton } from "@/components/wallet/unified-connect-button";

export function ConnectMenuButton({ className }: { className?: string }) {
  return <UnifiedConnectButton className={className} label="Connect" />;
}
