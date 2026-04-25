import { kv } from "@vercel/kv";

import type { PriviiTagRecord } from "@/lib/types";
import { normalizePriviiTag } from "@/lib/utils";

const tagKey = (tag: string) => `privii:tag:${normalizePriviiTag(tag)}`;
const ownerKey = (wallet: string) => `privii:owner:${wallet}`;

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
  await kv.set(ownerKey(record.ownerWallet), record.tag);
  return record;
}
