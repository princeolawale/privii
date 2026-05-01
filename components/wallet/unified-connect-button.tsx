"use client";

import { useAppKit } from "@reown/appkit/react";
import type { ChainNamespace } from "@reown/appkit-common";

import { useConnectedWallets } from "@/components/wallet/use-connected-wallets";
import { truncateWalletAddress } from "@/lib/utils";

type SupportedNamespace = Extract<ChainNamespace, "solana" | "eip155">;

export function UnifiedConnectButton({
  className,
  namespace,
  label = "Connect"
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
      className={`inline-flex min-h-14 items-center justify-center rounded-2xl border border-white bg-white px-5 text-base font-medium text-black shadow-[0_10px_30px_rgba(255,255,255,0.06)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-accent/30 ${className ?? ""}`}
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
