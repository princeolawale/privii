"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PriviiTagRecord } from "@/lib/types";
import { truncateWalletAddress } from "@/lib/utils";

export function DashboardClient() {
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const [tagRecord, setTagRecord] = useState<PriviiTagRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchTag() {
      if (!walletAddress) {
        setTagRecord(null);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/tags/by-owner/${encodeURIComponent(walletAddress)}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          setTagRecord(null);
          return;
        }

        const result = (await response.json()) as { tag: PriviiTagRecord };
        setTagRecord(result.tag);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTag();
  }, [walletAddress]);

  if (!connected) {
    return (
      <Card className="mx-auto max-w-2xl space-y-4 rounded-[32px] p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm leading-6 text-secondary">
          Connect your wallet to view your Privii tag and future payment history.
        </p>
        <ConnectWalletButton />
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Card className="rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-secondary">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your Privii</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Connected as {truncateWalletAddress(walletAddress)}.
        </p>

        {isLoading ? (
          <p className="mt-6 text-sm text-secondary">Loading your tag...</p>
        ) : tagRecord ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-[24px] border border-border bg-background/60 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">Registered tag</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">
                {tagRecord.tag}.privii.cash
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <LinkDetail label="Primary link" value={tagRecord.primaryUrl} />
                <LinkDetail label="Fallback link" value={tagRecord.fallbackUrl} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Placeholder title="Incoming payments" />
              <Placeholder title="Claimable balance" />
              <Placeholder title="Payment history" />
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-border bg-background/60 p-5">
            <p className="text-lg font-medium text-primary">No Privii tag yet</p>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Start onboarding to register your payment identity.
            </p>
            <Link href="/get-started" className="mt-5 inline-flex">
              <Button>Get Started</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function LinkDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{label}</p>
      <p className="break-all text-sm text-primary">{value}</p>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <Card className="rounded-[24px] p-5">
      <p className="text-lg font-medium text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-secondary">Private claim flow coming soon.</p>
    </Card>
  );
}
