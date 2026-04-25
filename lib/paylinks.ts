import { kv } from "@vercel/kv";

import type { PayLinkRecord } from "@/lib/types";

const linkKey = (slug: string) => `paylink:${slug.toLowerCase()}`;

export async function getPayLink(slug: string) {
  return kv.get<PayLinkRecord>(linkKey(slug));
}

export async function savePayLink(link: PayLinkRecord) {
  await kv.set(linkKey(link.slug), link);
  return link;
}

export async function slugExists(slug: string) {
  const link = await getPayLink(slug);
  return Boolean(link);
}
