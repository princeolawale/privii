"use client";

import { useAppKitAccount, useAppKitState } from "@reown/appkit/react";

import type { WalletType } from "@/lib/types";

export function useConnectedWallets() {
  const solanaAccount = useAppKitAccount({ namespace: "solana" });
  const evmAccount = useAppKitAccount({ namespace: "eip155" });
  const { activeChain } = useAppKitState();

  const solanaAddress = solanaAccount.address ?? "";
  const evmAddress = evmAccount.address ?? "";
  const solanaConnected = Boolean(solanaAccount.isConnected && solanaAddress);
  const evmConnected = Boolean(evmAccount.isConnected && evmAddress);

  let primaryWalletType: WalletType | null = null;

  if (activeChain === "solana" && solanaConnected) {
    primaryWalletType = "solana";
  } else if (activeChain === "eip155" && evmConnected) {
    primaryWalletType = "evm";
  } else if (solanaConnected) {
    primaryWalletType = "solana";
  } else if (evmConnected) {
    primaryWalletType = "evm";
  }

  const primaryWalletAddress =
    primaryWalletType === "solana"
      ? solanaAddress || null
      : primaryWalletType === "evm"
        ? evmAddress || null
        : null;

  return {
    activeChain,
    anyWalletConnected: solanaConnected || evmConnected,
    evmAddress,
    evmConnected,
    primaryWalletAddress,
    primaryWalletType,
    solanaAddress,
    solanaConnected
  };
}
