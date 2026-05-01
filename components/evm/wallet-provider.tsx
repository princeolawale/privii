"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { http, WagmiProvider } from "wagmi";

import { APP_NAME } from "@/lib/constants";
import { EVM_SUPPORTED_CHAINS, getEvmRpcUrl } from "@/lib/evm/chains";

export const evmConfig = getDefaultConfig({
  appName: APP_NAME,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "privii-demo-project-id",
  chains: EVM_SUPPORTED_CHAINS,
  transports: {
    1: http(getEvmRpcUrl("ethereum")),
    8453: http(getEvmRpcUrl("base")),
    42161: http(getEvmRpcUrl("arbitrum")),
    56: http(getEvmRpcUrl("bsc"))
  },
  ssr: true
});

export function EvmWalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={evmConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#7C5CFF",
            accentColorForeground: "#FFFFFF",
            borderRadius: "large",
            fontStack: "system"
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
