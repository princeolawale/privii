import { clusterApiUrl, PublicKey } from "@solana/web3.js";

import { USDC_MINT } from "@/lib/constants";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");

export const USDC_MINT_ADDRESS = new PublicKey(USDC_MINT);
