export type PayLinkToken = "SOL" | "USDC";
export type PayLinkType = "permanent" | "expiring";
export type PayLinkExpiryOption = "none" | "1h" | "24h" | "7d";
export type StealthMode = "coming_soon" | "enabled";
export type PaymentStatus = "initialized" | "submitted" | "confirmed" | "failed" | "expired";

export type PayLinkRecord = {
  tag: string;
  amount: string | null;
  token: PayLinkToken;
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
  recipientWallet?: string | null;
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
  asset: PayLinkToken;
  amount: string | null;
  expected_amount: string;
  tx_signature: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
};
