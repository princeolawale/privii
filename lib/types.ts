export type PayLinkToken = "SOL" | "USDC";
export type PayLinkType = "permanent" | "expiring";
export type PayLinkExpiryOption = "none" | "1h" | "24h" | "7d";

export type PayLinkRecord = {
  slug: string;
  amount: string | null;
  token: PayLinkToken;
  type: PayLinkType;
  expiryOption: PayLinkExpiryOption;
  expiresAt: number | null;
  recipientWallet: string;
  createdAt: number;
};

export type PayLinkResponse = {
  link: PayLinkRecord;
  status: "active" | "expired";
};
