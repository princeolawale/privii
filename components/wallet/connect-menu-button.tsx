"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

import { EvmConnectWalletButton } from "@/components/evm/connect-wallet-button";
import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { truncateWalletAddress } from "@/lib/utils";

export function ConnectMenuButton({ className }: { className?: string }) {
  const { publicKey, connected } = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const [open, setOpen] = useState(false);

  const label =
    connected && evmConnected
      ? "Wallets connected"
      : connected
        ? "Solana connected"
        : evmConnected
          ? "EVM connected"
          : "Connect";

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base font-medium text-white transition duration-200 hover:border-white/20 hover:bg-white/[0.07]"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <ChevronDown className="h-4 w-4 text-secondary" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 rounded-[28px] border border-border bg-card p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">Solana</p>
              <p className="mt-2 text-sm text-secondary">
                {connected && publicKey ? truncateWalletAddress(publicKey.toBase58()) : "Not connected"}
              </p>
              <div className="mt-3">
                <ConnectWalletButton className="!w-full" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">EVM</p>
              <p className="mt-2 text-sm text-secondary">
                {evmConnected && evmAddress ? truncateWalletAddress(evmAddress) : "Not connected"}
              </p>
              <div className="mt-3">
                <EvmConnectWalletButton className="!w-full" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
