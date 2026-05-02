"use client";

import { usePriviiWallet } from "@/components/wallet/use-privii-wallet";

export function useConnectedWallets() {
  const wallet = usePriviiWallet();

  return {
    activeChain: wallet.activeChain,
    anyWalletConnected: wallet.isConnected,
    evmAddress: wallet.evmAddress,
    evmConnected: wallet.evmConnected,
    primaryWalletAddress: wallet.address,
    primaryWalletType: wallet.walletType,
    solanaAddress: wallet.solanaAddress,
    solanaConnected: wallet.solanaConnected
  };
}
