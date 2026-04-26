import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { PRIVII_FALLBACK_DOMAIN, PRIVII_ROOT_DOMAIN } from "@/lib/constants";
import type { PayLinkExpiryOption } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function generateRandomTag() {
  return `privii-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizePriviiTag(value: string) {
  return value.trim().toLowerCase();
}

export function isValidPriviiTag(tag: string) {
  return /^[a-z0-9-]{3,24}$/.test(normalizePriviiTag(tag));
}

export function expiryToTimestamp(option: PayLinkExpiryOption) {
  const now = Date.now();

  switch (option) {
    case "1h":
      return now + 60 * 60 * 1000;
    case "24h":
      return now + 24 * 60 * 60 * 1000;
    case "7d":
      return now + 7 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

export function isExpired(expiresAt: number | null) {
  return typeof expiresAt === "number" && expiresAt <= Date.now();
}

export function truncateWalletAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatAmount(amount: string | null, token: string) {
  if (!amount) {
    return "Custom amount";
  }

  return `${amount} ${token}`;
}

export function buildPaymentUrl(tag: string) {
  return `${getBaseUrl()}/pay/${tag}`;
}

export function buildPrimaryTagUrl(tag: string) {
  return `https://${normalizePriviiTag(tag)}.${PRIVII_ROOT_DOMAIN}`;
}

export function buildFallbackTagUrl(tag: string) {
  return `https://${PRIVII_FALLBACK_DOMAIN}/${normalizePriviiTag(tag)}`;
}

export function buildWhatsAppShareUrl(url: string, tag: string) {
  return `https://wa.me/?text=${encodeURIComponent(
    `Pay me privately with my Privii link: ${url} (@${tag})`
  )}`;
}

export function buildXShareUrl(url: string, tag: string) {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(
    `Get paid in crypto with my Privii link ${url} @${tag}`
  )}`;
}
