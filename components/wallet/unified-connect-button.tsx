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
      className={`inline-flex min-h-14 items-center justify-center rounded-2xl border border-mint/30 bg-[linear-gradient(180deg,rgba(16,16,18,0.98)_0%,rgba(10,10,10,0.98)_100%)] px-5 text-base font-medium text-primary shadow-[0_0_0_1px_rgba(0,240,181,0.08),0_16px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,240,181,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-mint/45 hover:shadow-[0_0_0_1px_rgba(0,240,181,0.16),0_20px_48px_rgba(0,0,0,0.44),0_0_20px_rgba(0,240,181,0.08)] focus:outline-none focus:ring-2 focus:ring-mint/25 ${className ?? ""}`}
      onClick={() =>
        open({
          namespace,
          view: isConnected ? "Account" : "Connect"
        })
      }
    >
      <span className="pointer-events-none relative z-10 inline-flex items-center">
        {buttonLabel}
      </span>
    </button>
  );
}
