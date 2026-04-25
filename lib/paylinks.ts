import { kv } from "@vercel/kv";

import type { PayLinkRecord } from "@/lib/types";

const linkKey = (tag: string) => `paylink:${tag.toLowerCase()}`;

export async function getPayLink(tag: string) {
  return kv.get<PayLinkRecord>(linkKey(tag));
}

export async function savePayLink(link: PayLinkRecord) {
  await kv.set(linkKey(link.tag), link);
  return link;
}

export async function tagExists(tag: string) {
  const link = await getPayLink(tag);
  return Boolean(link);
}
