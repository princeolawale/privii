"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

import type { PriviiTagRecord } from "@/lib/types";

export function useOwnerTag() {
  const { publicKey, connected } = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const walletAddress = publicKey?.toBase58() ?? "";
  const normalizedEvmAddress = evmAddress ?? "";
  const [tagRecord, setTagRecord] = useState<PriviiTagRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchTag() {
      if ((!connected || !walletAddress) && (!evmConnected || !normalizedEvmAddress)) {
        setTagRecord(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const candidates = [
          connected && walletAddress ? walletAddress : null,
          evmConnected && normalizedEvmAddress ? normalizedEvmAddress : null
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
  }, [connected, walletAddress, evmConnected, normalizedEvmAddress]);

  return {
    connected,
    evmConnected,
    walletAddress,
    evmAddress: normalizedEvmAddress,
    tagRecord,
    hasTag: Boolean(tagRecord),
    isLoading
  };
}
