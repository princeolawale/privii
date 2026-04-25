"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletButton() {
  return (
    <WalletMultiButton className="!h-11 !rounded-2xl !bg-accent !px-4 !text-sm !font-medium !text-primary hover:!opacity-95" />
  );
}
