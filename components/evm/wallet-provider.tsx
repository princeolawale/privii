"use client";

import "@reown/appkit-polyfills";

import { AppKitProvider } from "@reown/appkit/react";
import { arbitrum, base, bsc, mainnet, solana } from "@reown/appkit/networks";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { getEvmRpcUrl } from "@/lib/evm/chains";
import { SOLANA_RPC_URL } from "@/lib/solana";

const reownProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "privii-demo-project-id";

const metadata = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: "https://privii.xyz",
  icons: ["https://privii.xyz/icon.png"]
};

const solanaNetwork = {
  ...solana,
  rpcUrls: {
    ...solana.rpcUrls,
    default: {
      ...solana.rpcUrls.default,
      http: [SOLANA_RPC_URL]
    }
  }
};

const ethereumNetwork = {
  ...mainnet,
  rpcUrls: {
    ...mainnet.rpcUrls,
    default: {
      ...mainnet.rpcUrls.default,
      http: [getEvmRpcUrl("ethereum")]
    }
  }
};

const baseNetwork = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: {
      ...base.rpcUrls.default,
      http: [getEvmRpcUrl("base")]
    }
  }
};

const arbitrumNetwork = {
  ...arbitrum,
  rpcUrls: {
    ...arbitrum.rpcUrls,
    default: {
      ...arbitrum.rpcUrls.default,
      http: [getEvmRpcUrl("arbitrum")]
    }
  }
};

const bscNetwork = {
  ...bsc,
  rpcUrls: {
    ...bsc.rpcUrls,
    default: {
      ...bsc.rpcUrls.default,
      http: [getEvmRpcUrl("bsc")]
    }
  }
};

const evmNetworks = [ethereumNetwork, baseNetwork, arbitrumNetwork, bscNetwork] as const;
const appkitNetworks = [solanaNetwork, ...evmNetworks] as const;

const wagmiAdapter = new WagmiAdapter({
  projectId: reownProjectId,
  networks: [...evmNetworks],
  customRpcUrls: {
    "eip155:1": [{ url: getEvmRpcUrl("ethereum") }],
    "eip155:8453": [{ url: getEvmRpcUrl("base") }],
    "eip155:42161": [{ url: getEvmRpcUrl("arbitrum") }],
    "eip155:56": [{ url: getEvmRpcUrl("bsc") }]
  }
});

const solanaAdapter = new SolanaAdapter({
  connectionSettings: "confirmed",
  registerWalletStandard: true,
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
    new GlowWalletAdapter()
  ]
});

export const evmConfig = wagmiAdapter.wagmiConfig;

export function EvmWalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={evmConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider
          adapters={[wagmiAdapter, solanaAdapter]}
          projectId={reownProjectId}
          metadata={metadata}
          networks={[...appkitNetworks]}
          defaultNetwork={solanaNetwork}
          themeMode="dark"
        >
          {children}
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
