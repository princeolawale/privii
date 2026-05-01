"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function EvmConnectWalletButton({ className }: { className?: string }) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        if (!mounted) {
          return (
            <button
              type="button"
              className={`inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base font-medium text-white ${className ?? ""}`}
              disabled
            >
              Connect
            </button>
          );
        }

        if (!account) {
          return (
            <button
              type="button"
              className={`inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] ${className ?? ""}`}
              onClick={openConnectModal}
            >
              Connect
            </button>
          );
        }

        if (chain?.unsupported) {
          return (
            <button
              type="button"
              className={`inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] ${className ?? ""}`}
              onClick={openChainModal}
            >
              Wrong network
            </button>
          );
        }

        return (
          <button
            type="button"
            className={`inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] ${className ?? ""}`}
            onClick={openAccountModal}
          >
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
