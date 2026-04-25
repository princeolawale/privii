"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletButton({ className }: { className?: string }) {
  return (
    <WalletMultiButton
      className={`!h-11 !rounded-2xl !border !border-white/10 !bg-white !px-4 !text-sm !font-medium !text-black !transition !duration-200 hover:!bg-white/90 ${className ?? ""}`}
    />
  );
}
