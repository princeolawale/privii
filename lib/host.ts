import { PRIVII_FALLBACK_DOMAIN, PRIVII_ROOT_DOMAIN } from "@/lib/constants";

function normalizePriviiTag(value: string) {
  return value.trim().toLowerCase();
}

const SUPPORTED_ROOT_DOMAINS = [PRIVII_ROOT_DOMAIN, PRIVII_FALLBACK_DOMAIN];

export function extractTagFromHost(host: string | null) {
  if (!host) {
    return null;
  }

  const normalizedHost = host.toLowerCase().split(":")[0];

  for (const domain of SUPPORTED_ROOT_DOMAINS) {
    if (
      normalizedHost === domain ||
      normalizedHost === `www.${domain}` ||
      !normalizedHost.endsWith(`.${domain}`)
    ) {
      continue;
    }

    const subdomain = normalizedHost.slice(0, normalizedHost.length - (`.${domain}`).length);

    if (!subdomain || subdomain.includes(".")) {
      return null;
    }

    return normalizePriviiTag(subdomain);
  }

  return null;
}

export function shouldSkipSubdomainRewrite(host: string | null) {
  if (!host) {
    return true;
  }

  const normalizedHost = host.toLowerCase().split(":")[0];

  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost.endsWith(".vercel.app")
  );
}
