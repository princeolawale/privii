export type PayLinkToken = "SOL" | "USDC";
export type PayLinkType = "permanent" | "expiring";
export type PayLinkExpiryOption = "none" | "1h" | "24h" | "7d";
export type StealthMode = "coming_soon" | "enabled";

export type PayLinkRecord = {
  tag: string;
  amount: string | null;
  token: PayLinkToken;
  type: PayLinkType;
  expiryOption: PayLinkExpiryOption;
  expiresAt: number | null;
  recipientWallet: string;
  createdAt: number;
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
  createdAt: string;
  status: "active";
  primaryUrl: string;
  fallbackUrl: string;
  stealthEnabled: boolean;
  stealthMode: StealthMode;
};
