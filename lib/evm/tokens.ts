import { erc20Abi } from "viem";

import { getEvmNetworkOption } from "@/lib/evm/chains";
import type { EvmNetwork, PaymentAsset } from "@/lib/types";

export type EvmTokenConfig = {
  symbol: PaymentAsset;
  name: string;
  chainId: number;
  decimals: number;
  contractAddress?: `0x${string}`;
  explorerUrl: string;
  isNative: boolean;
  abi?: typeof erc20Abi;
};

const ethereum = getEvmNetworkOption("ethereum");
const base = getEvmNetworkOption("base");
const arbitrum = getEvmNetworkOption("arbitrum");
const bsc = getEvmNetworkOption("bsc");

export const EVM_TOKENS: Record<EvmNetwork, EvmTokenConfig[]> = {
  ethereum: [
    {
      symbol: "ETH",
      name: "Ether",
      chainId: ethereum.chain.id,
      decimals: 18,
      explorerUrl: ethereum.explorerBaseUrl,
      isNative: true
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      chainId: ethereum.chain.id,
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      explorerUrl: ethereum.explorerBaseUrl,
      isNative: false,
      abi: erc20Abi
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      chainId: ethereum.chain.id,
      contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
      explorerUrl: ethereum.explorerBaseUrl,
      isNative: false,
      abi: erc20Abi
    }
  ],
  base: [
    {
      symbol: "ETH",
      name: "Ether",
      chainId: base.chain.id,
      decimals: 18,
      explorerUrl: base.explorerBaseUrl,
      isNative: true
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      chainId: base.chain.id,
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
      explorerUrl: base.explorerBaseUrl,
      isNative: false,
      abi: erc20Abi
    }
  ],
  arbitrum: [
    {
      symbol: "ETH",
      name: "Ether",
      chainId: arbitrum.chain.id,
      decimals: 18,
      explorerUrl: arbitrum.explorerBaseUrl,
      isNative: true
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      chainId: arbitrum.chain.id,
      contractAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
      explorerUrl: arbitrum.explorerBaseUrl,
      isNative: false,
      abi: erc20Abi
    }
  ],
  bsc: [
    {
      symbol: "BNB",
      name: "BNB",
      chainId: bsc.chain.id,
      decimals: 18,
      explorerUrl: bsc.explorerBaseUrl,
      isNative: true
    }
  ]
};

export function getEvmTokenConfig(network: EvmNetwork, asset: PaymentAsset) {
  return EVM_TOKENS[network].find((token) => token.symbol === asset) ?? null;
}
