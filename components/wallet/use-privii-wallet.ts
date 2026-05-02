"use client";

import { useAppKitAccount, useAppKitState } from "@reown/appkit/react";
import { useAccount } from "wagmi";

import type { WalletType } from "@/lib/types";

export function usePriviiWallet() {
  const solanaAccount = useAppKitAccount({ namespace: "solana" });
  const evmAccount = useAppKitAccount({ namespace: "eip155" });
  const { activeChain } = useAppKitState();
  const { chainId: wagmiChainId } = useAccount();

  const solanaAddress = solanaAccount.address ?? "";
  const evmAddress = evmAccount.address ?? "";
  const solanaConnected = Boolean(solanaAccount.isConnected && solanaAddress);
  const evmConnected = Boolean(evmAccount.isConnected && evmAddress);

  let walletType: WalletType | null = null;

  if (activeChain === "solana" && solanaConnected) {
    walletType = "solana";
  } else if (activeChain === "eip155" && evmConnected) {
    walletType = "evm";
  } else if (solanaConnected) {
    walletType = "solana";
  } else if (evmConnected) {
    walletType = "evm";
  }

  const address =
    walletType === "solana"
      ? solanaAddress || null
      : walletType === "evm"
        ? evmAddress || null
        : null;

  return {
    walletType,
    address,
    evmAddress,
    solanaAddress,
    evmChainId: wagmiChainId ?? null,
    evmConnected,
    solanaConnected,
    isConnected: solanaConnected || evmConnected,
    activeChain
  };
}
