"use client";

import { useAppKit } from "@reown/appkit/react";
import type { ChainNamespace } from "@reown/appkit-common";

import { useConnectedWallets } from "@/components/wallet/use-connected-wallets";
import { truncateWalletAddress } from "@/lib/utils";

type SupportedNamespace = Extract<ChainNamespace, "solana" | "eip155">;

export function UnifiedConnectButton({
  className,
  namespace,
  label = "Connect Wallet"
}: {
  className?: string;
  namespace?: SupportedNamespace;
  label?: string;
}) {
  const { open } = useAppKit();
  const {
    evmAddress,
    evmConnected,
    primaryWalletAddress,
    solanaAddress,
    solanaConnected
  } = useConnectedWallets();

  const namespaceAddress =
    namespace === "solana"
      ? solanaAddress
      : namespace === "eip155"
        ? evmAddress
        : primaryWalletAddress || "";
  const isConnected =
    namespace === "solana"
      ? solanaConnected
      : namespace === "eip155"
        ? evmConnected
        : Boolean(primaryWalletAddress);

  const buttonLabel = isConnected && namespaceAddress
    ? truncateWalletAddress(namespaceAddress)
    : label;

  return (
    <button
      type="button"
      className={`inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] ${className ?? ""}`}
      onClick={() =>
        open({
          namespace,
          view: isConnected ? "Account" : "Connect"
        })
      }
    >
      {buttonLabel}
    </button>
  );
}
