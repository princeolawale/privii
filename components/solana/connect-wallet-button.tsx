"use client";

import { BaseWalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletButton({ className }: { className?: string }) {
  return (
    <BaseWalletMultiButton
      labels={{
        "change-wallet": "Wallet",
        "copy-address": "Copy",
        copied: "Copied",
        disconnect: "Disconnect",
        connecting: "Connect",
        "has-wallet": "Connect",
        "no-wallet": "Connect"
      }}
      className={`!inline-flex !min-h-14 !items-center !justify-center !rounded-2xl !border !border-white/10 !bg-white/[0.04] !px-5 !text-base !font-medium !text-white !transition !duration-200 hover:!border-white/20 hover:!bg-white/[0.07] ${className ?? ""}`}
    />
  );
}
