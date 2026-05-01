import { arbitrum, base, bsc, mainnet } from "viem/chains";
import type { Chain } from "viem";

import type { EvmNetwork, PaymentAsset } from "@/lib/types";

export type EvmNetworkOption = {
  key: EvmNetwork;
  label: string;
  chain: Chain;
  nativeAsset: Extract<PaymentAsset, "ETH" | "BNB">;
  explorerBaseUrl: string;
};

export const EVM_NETWORK_OPTIONS: EvmNetworkOption[] = [
  {
    key: "ethereum",
    label: "Ethereum",
    chain: mainnet,
    nativeAsset: "ETH",
    explorerBaseUrl: "https://etherscan.io/tx/"
  },
  {
    key: "base",
    label: "Base",
    chain: base,
    nativeAsset: "ETH",
    explorerBaseUrl: "https://basescan.org/tx/"
  },
  {
    key: "arbitrum",
    label: "Arbitrum",
    chain: arbitrum,
    nativeAsset: "ETH",
    explorerBaseUrl: "https://arbiscan.io/tx/"
  },
  {
    key: "bsc",
    label: "BNB Chain",
    chain: bsc,
    nativeAsset: "BNB",
    explorerBaseUrl: "https://bscscan.com/tx/"
  }
];

export const EVM_NETWORK_MAP = Object.fromEntries(
  EVM_NETWORK_OPTIONS.map((option) => [option.key, option])
) as Record<EvmNetwork, EvmNetworkOption>;

export const EVM_SUPPORTED_CHAINS = [
  mainnet,
  base,
  arbitrum,
  bsc
] as const;

export function getEvmNetworkOption(network: EvmNetwork) {
  return EVM_NETWORK_MAP[network];
}

export function getEvmRpcUrl(network: EvmNetwork) {
  const option = getEvmNetworkOption(network);

  switch (network) {
    case "ethereum":
      return process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || option.chain.rpcUrls.default.http[0];
    case "base":
      return process.env.NEXT_PUBLIC_BASE_RPC_URL || option.chain.rpcUrls.default.http[0];
    case "arbitrum":
      return process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || option.chain.rpcUrls.default.http[0];
    case "bsc":
      return process.env.NEXT_PUBLIC_BSC_RPC_URL || option.chain.rpcUrls.default.http[0];
  }
}
