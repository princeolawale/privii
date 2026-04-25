"use client";

import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { useMemo, type ReactNode } from "react";

import { SOLANA_RPC_URL } from "@/lib/solana";

export function SolanaWalletProvider({
  children
}: {
  children: ReactNode;
}) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter()
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
