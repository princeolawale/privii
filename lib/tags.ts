import { kv } from "@vercel/kv";
import { isAddress } from "viem";

import type { PriviiTagRecord } from "@/lib/types";
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

export function resolveTagSolanaWallet(record: {
  solanaWallet?: string | null;
  recipientWallet?: string | null;
  ownerWallet?: string | null;
}) {
  return (
    record.solanaWallet?.trim() ||
    record.recipientWallet?.trim() ||
    record.ownerWallet?.trim() ||
    ""
  );
}

export function resolveTagEvmWallet(record: {
  evmWallet?: string | null;
}) {
  return record.evmWallet?.trim() || null;
}
