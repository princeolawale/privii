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
      className={`!h-10 !rounded-full !border !border-white/10 !bg-white/5 !px-4 !text-sm !font-medium !text-white !transition !duration-200 hover:!border-white/20 hover:!bg-white/10 ${className ?? ""}`}
    />
  );
}
