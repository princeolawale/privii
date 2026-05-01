"use client";

import { useEffect, useState } from "react";

import { useConnectedWallets } from "@/components/wallet/use-connected-wallets";
import type { PriviiTagRecord } from "@/lib/types";

export function useOwnerTag() {
  const {
    evmAddress,
    evmConnected,
    primaryWalletAddress,
    primaryWalletType,
    solanaAddress,
    solanaConnected
  } = useConnectedWallets();
  const [tagRecord, setTagRecord] = useState<PriviiTagRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchTag() {
      if ((!solanaConnected || !solanaAddress) && (!evmConnected || !evmAddress)) {
        setTagRecord(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const candidates = [
          solanaConnected && solanaAddress ? solanaAddress : null,
          evmConnected && evmAddress ? evmAddress : null
        ].filter((value): value is string => Boolean(value));

        let resultTag: PriviiTagRecord | null = null;

        for (const candidate of candidates) {
          const response = await fetch(`/api/tags/by-owner/${encodeURIComponent(candidate)}`, {
            cache: "no-store"
          });

          if (response.ok) {
            const result = (await response.json()) as { tag: PriviiTagRecord };
            resultTag = result.tag;
            break;
          }
        }

        if (!cancelled) {
          setTagRecord(resultTag);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTag();

    return () => {
      cancelled = true;
    };
  }, [evmAddress, evmConnected, solanaAddress, solanaConnected]);

  return {
    connected: solanaConnected,
    evmConnected,
    evmAddress,
    primaryWalletAddress,
    primaryWalletType,
    walletAddress: solanaAddress,
    tagRecord,
    hasTag: Boolean(tagRecord),
    isLoading
  };
}
