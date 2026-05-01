export type PayLinkToken = "SOL" | "USDC";
export type PayLinkType = "permanent" | "expiring";
export type PayLinkExpiryOption = "none" | "1h" | "24h" | "7d";
export type StealthMode = "coming_soon" | "enabled";
export type PaymentStatus = "initialized" | "submitted" | "confirmed" | "failed" | "expired";
export type EvmNetwork = "ethereum" | "base" | "arbitrum" | "bsc";
export type PaymentNetwork = "solana" | EvmNetwork;
export type PaymentAsset = "SOL" | "USDC" | "USDT" | "ETH" | "BNB";
export type WalletType = "solana" | "evm";

export type PayLinkRecord = {
  tag: string;
  amount: string | null;
  token: PaymentAsset;
  network?: PaymentNetwork | null;
  walletType?: WalletType | null;
  receiverWallet?: string | null;
  receiverTag?: string | null;
  type: PayLinkType;
  expiryOption: PayLinkExpiryOption;
  expiresAt: number | null;
  recipientWallet: string;
  createdAt: number;
  creatorWallet?: string;
  creatorTag?: string | null;
  paymentPurpose?: string | null;
  ownerTag?: string | null;
  stealthEnabled: boolean;
  stealthMode: StealthMode;
};

export type PayLinkResponse = {
  link: PayLinkRecord;
  status: "active" | "expired";
};

export type PriviiTagRecord = {
  tag: string;
  ownerWallet: string;
  walletType?: WalletType | null;
  walletAddress?: string | null;
  recipientWallet?: string | null;
  solanaWallet?: string | null;
  evmWallet?: string | null;
  createdAt: string;
  status: "active";
  primaryUrl: string;
  fallbackUrl: string;
  stealthEnabled: boolean;
  stealthMode: StealthMode;
};

export type PaymentRecord = {
  id: string;
  tag: string;
  recipient_wallet: string;
  payer_wallet: string | null;
  receiver_tag?: string | null;
  asset: PaymentAsset;
  chain: PaymentNetwork;
  chain_id: number | null;
  amount: string | null;
  expected_amount: string;
  tx_signature: string | null;
  explorer_url?: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
};
