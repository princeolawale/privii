import { kv } from "@vercel/kv";

import type { PayLinkRecord } from "@/lib/types";

const linkKey = (tag: string) => `paylink:${tag.toLowerCase()}`;
const ownerKey = (wallet: string) => `paylink:owner:${wallet}`;

export async function getPayLink(tag: string) {
  return kv.get<PayLinkRecord>(linkKey(tag));
}

export async function savePayLink(link: PayLinkRecord) {
  await kv.set(linkKey(link.tag), link);
  const existing = (await kv.get<string[]>(ownerKey(link.recipientWallet))) ?? [];

  if (!existing.includes(link.tag)) {
    await kv.set(ownerKey(link.recipientWallet), [...existing, link.tag]);
  }

  return link;
}

export async function tagExists(tag: string) {
  const link = await getPayLink(tag);
  return Boolean(link);
}

export async function getPayLinksByOwner(wallet: string) {
  const tags = (await kv.get<string[]>(ownerKey(wallet))) ?? [];
  const links = await Promise.all(tags.map((tag) => getPayLink(tag)));
  return links.filter((link): link is PayLinkRecord => Boolean(link));
}
