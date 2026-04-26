"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

import type { PriviiTagRecord } from "@/lib/types";

export function useOwnerTag() {
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const [tagRecord, setTagRecord] = useState<PriviiTagRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchTag() {
      if (!connected || !walletAddress) {
        setTagRecord(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/tags/by-owner/${encodeURIComponent(walletAddress)}`, {
          cache: "no-store"
        });

        if (!cancelled) {
          if (response.ok) {
            const result = (await response.json()) as { tag: PriviiTagRecord };
            setTagRecord(result.tag);
          } else {
            setTagRecord(null);
          }
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
  }, [connected, walletAddress]);

  return {
    connected,
    walletAddress,
    tagRecord,
    hasTag: Boolean(tagRecord),
    isLoading
  };
}
