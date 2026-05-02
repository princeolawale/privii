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
  const record = await kv.get<PriviiTagRecord>(tagKey(tag));

  if (record) {
    await ensureTagOwnerIndexes(record);
  }

  return record;
}

export async function getPriviiTagByOwner(wallet: string) {
  const storedTag = await kv.get<string>(ownerKey(wallet));

  if (storedTag) {
    const record = await getPriviiTag(storedTag);

    if (record) {
      return record;
    }
  }

  const normalizedWallet = normalizeOwnerWallet(wallet);
  const scan = await findPriviiTagByWallet(normalizedWallet);

  if (!scan) {
    return null;
  }

  await ensureTagOwnerIndexes(scan);
  return scan;
}

export async function priviiTagExists(tag: string) {
  const record = await getPriviiTag(tag);
  return Boolean(record);
}

export async function savePriviiTag(record: PriviiTagRecord) {
  await kv.set(tagKey(record.tag), record);
  await ensureTagOwnerIndexes(record);
  return record;
}

export async function ensureTagOwnerIndexes(record: PriviiTagRecord) {
  const ownerWallets = new Set(
    [
      record.ownerWallet?.trim(),
      resolveTagSolanaWallet(record),
      resolveTagEvmWallet(record)
    ].filter((value): value is string => Boolean(value))
  );

  await Promise.all([...ownerWallets].map((wallet) => kv.set(ownerKey(wallet), record.tag)));
}

export async function isWalletLinkedToAnyTag(wallet: string) {
  return Boolean(await getPriviiTagByOwner(wallet));
}

async function findPriviiTagByWallet(wallet: string) {
  let cursor = 0;

  while (true) {
    const [nextCursor, keys] = await kv.scan(cursor, {
      match: "privii:tag:*",
      count: 100
    });

    if (keys.length) {
      const records = await Promise.all(
        keys.map((key) => kv.get<PriviiTagRecord>(key))
      );
      const record = records.find((candidate) => {
        if (!candidate) {
          return false;
        }

        const wallets = [
          candidate.ownerWallet?.trim(),
          resolveTagSolanaWallet(candidate),
          resolveTagEvmWallet(candidate)
        ]
          .filter((value): value is string => Boolean(value))
          .map((value) => normalizeOwnerWallet(value));

        return wallets.includes(wallet);
      });

      if (record) {
        return record;
      }
    }

    if (Number(nextCursor) === 0) {
      return null;
    }

    cursor = Number(nextCursor);
  }
}

export function hasTagSolanaWallet(record: {
  ownerWallet?: string | null;
  walletType?: WalletType | null;
  walletAddress?: string | null;
  recipientWallet?: string | null;
  solanaWallet?: string | null;
}) {
  return Boolean(resolveTagSolanaWallet(record));
}

export function hasTagEvmWallet(record: {
  ownerWallet?: string | null;
  walletType?: WalletType | null;
  walletAddress?: string | null;
  evmWallet?: string | null;
}) {
  return Boolean(resolveTagEvmWallet(record));
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
  if (record.solanaWallet?.trim()) {
    return record.solanaWallet.trim();
  }

  if (record.walletType === "solana" && record.walletAddress?.trim()) {
    return record.walletAddress.trim();
  }

  if (record.recipientWallet?.trim()) {
    return record.recipientWallet.trim();
  }

  if (record.ownerWallet?.trim() && !isAddress(record.ownerWallet.trim())) {
    return record.ownerWallet.trim();
  }

  return "";
}

export function resolveTagEvmWallet(record: {
  ownerWallet?: string | null;
  walletType?: WalletType | null;
  walletAddress?: string | null;
  evmWallet?: string | null;
}) {
  if (record.evmWallet?.trim()) {
    return record.evmWallet.trim();
  }

  if (record.walletType === "evm" && record.walletAddress?.trim()) {
    return record.walletAddress.trim();
  }

  if (record.ownerWallet?.trim() && isAddress(record.ownerWallet.trim())) {
    return record.ownerWallet.trim();
  }

  return null;
}
