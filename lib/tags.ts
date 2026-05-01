import { kv } from "@vercel/kv";
import { isAddress } from "viem";

import type { PriviiTagRecord, WalletType } from "@/lib/types";
import { normalizePriviiTag } from "@/lib/utils";

const tagKey = (tag: string) => `privii:tag:${normalizePriviiTag(tag)}`;
const ownerKey = (wallet: string) => `privii:owner:${normalizeOwnerWallet(wallet)}`;

function normalizeOwnerWallet(wallet: string) {
  const normalized = wallet.trim();
  return isAddress(normalized) ? normalized.toLowerCase() : normalized;
}

export async function getPriviiTag(tag: string) {
  return kv.get<PriviiTagRecord>(tagKey(tag));
}

export async function getPriviiTagByOwner(wallet: string) {
  const storedTag = await kv.get<string>(ownerKey(wallet));

  if (!storedTag) {
    return null;
  }

  return getPriviiTag(storedTag);
}

export async function priviiTagExists(tag: string) {
  const record = await getPriviiTag(tag);
  return Boolean(record);
}

export async function savePriviiTag(record: PriviiTagRecord) {
  await kv.set(tagKey(record.tag), record);
  const ownerWallets = new Set(
    [
      record.ownerWallet?.trim(),
      resolveTagSolanaWallet(record),
      resolveTagEvmWallet(record)
    ].filter((value): value is string => Boolean(value))
  );

  await Promise.all(
    [...ownerWallets].map((wallet) => kv.set(ownerKey(wallet), record.tag))
  );
  return record;
}

export function resolveTagWalletType(record: {
  walletType?: WalletType | null;
  walletAddress?: string | null;
  ownerWallet?: string | null;
  solanaWallet?: string | null;
  recipientWallet?: string | null;
  evmWallet?: string | null;
}) {
  if (record.walletType === "solana" || record.walletType === "evm") {
    return record.walletType;
  }

  if (record.walletAddress && isAddress(record.walletAddress)) {
    return "evm" as const;
  }

  if (record.evmWallet && !record.solanaWallet && !record.recipientWallet) {
    return "evm" as const;
  }

  if (record.ownerWallet && isAddress(record.ownerWallet) && !record.solanaWallet && !record.recipientWallet) {
    return "evm" as const;
  }

  if (record.solanaWallet || record.recipientWallet || record.ownerWallet) {
    return "solana" as const;
  }

  return "solana" as const;
}

export function resolveTagWalletAddress(record: {
  walletType?: WalletType | null;
  walletAddress?: string | null;
  ownerWallet?: string | null;
  solanaWallet?: string | null;
  recipientWallet?: string | null;
  evmWallet?: string | null;
}) {
  const walletType = resolveTagWalletType(record);

  if (walletType === "evm") {
    return record.walletAddress?.trim() || record.evmWallet?.trim() || record.ownerWallet?.trim() || null;
  }

  return (
    record.walletAddress?.trim() ||
    record.solanaWallet?.trim() ||
    record.recipientWallet?.trim() ||
    record.ownerWallet?.trim() ||
    null
  );
}

export function resolveTagSolanaWallet(record: {
  solanaWallet?: string | null;
  recipientWallet?: string | null;
  ownerWallet?: string | null;
  walletType?: WalletType | null;
  walletAddress?: string | null;
}) {
  if (resolveTagWalletType(record) === "evm") {
    return "";
  }

  return (
    record.walletAddress?.trim() ||
    record.solanaWallet?.trim() ||
    record.recipientWallet?.trim() ||
    record.ownerWallet?.trim() ||
    ""
  );
}

export function resolveTagEvmWallet(record: {
  walletType?: WalletType | null;
  walletAddress?: string | null;
  evmWallet?: string | null;
}) {
  if (resolveTagWalletType(record) === "solana") {
    return null;
  }

  return record.walletAddress?.trim() || record.evmWallet?.trim() || null;
}
