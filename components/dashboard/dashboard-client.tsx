"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PayLinkRecord, PriviiTagRecord } from "@/lib/types";
import { truncateWalletAddress } from "@/lib/utils";

export function DashboardClient() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const [tagRecord, setTagRecord] = useState<PriviiTagRecord | null>(null);
  const [links, setLinks] = useState<PayLinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [payTarget, setPayTarget] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!walletAddress) {
        setTagRecord(null);
        setLinks([]);
        return;
      }

      setIsLoading(true);

      try {
        const [tagResponse, linksResponse] = await Promise.all([
          fetch(`/api/tags/by-owner/${encodeURIComponent(walletAddress)}`, {
            cache: "no-store"
          }),
          fetch(`/api/links/by-owner/${encodeURIComponent(walletAddress)}`, {
            cache: "no-store"
          })
        ]);

        if (tagResponse.ok) {
          const result = (await tagResponse.json()) as { tag: PriviiTagRecord };
          setTagRecord(result.tag);
        } else {
          setTagRecord(null);
        }

        if (linksResponse.ok) {
          const result = (await linksResponse.json()) as { links: PayLinkRecord[] };
          setLinks(result.links);
        } else {
          setLinks([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [walletAddress]);

  function handlePaySomeone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = payTarget.trim();

    if (!value) {
      return;
    }

    try {
      const url = new URL(value);
      const pathname = url.pathname.replace(/^\/+/, "");

      if (pathname.startsWith("pay/")) {
        router.push(`/${pathname}`);
        return;
      }

      if (pathname) {
        router.push(`/${pathname}`);
        return;
      }
    } catch {
      // Not a URL, treat as slug/tag below.
    }

    if (value.includes("/pay/")) {
      const slug = value.split("/pay/").pop();

      if (slug) {
        router.push(`/pay/${slug.replace(/^\/+/, "")}`);
        return;
      }
    }

    if (value.startsWith("pay/")) {
      router.push(`/${value}`);
      return;
    }

    router.push(`/${value.replace(/^\/+/, "")}`);
  }

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
              <div className="mt-5 flex flex-col gap-4 sm:flex-row">
                <Button
                  className="w-full sm:w-auto"
                  onClick={async () => navigator.clipboard.writeText(tagRecord.fallbackUrl)}
                >
                  Copy tag link
                </Button>
                <Link href={`/${tagRecord.tag}`}>
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Open tag page
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="rounded-[24px] p-5">
              <p className="text-lg font-medium text-primary">Pay someone</p>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Paste a tag, tag URL, or PayLink and we&apos;ll open the existing payment
                page.
              </p>
              <form className="mt-4 flex flex-col gap-4 sm:flex-row" onSubmit={handlePaySomeone}>
                <Input
                  value={payTarget}
                  placeholder="prince or https://privii.xyz/prince"
                  onChange={(event) => setPayTarget(event.target.value)}
                />
                <Button className="w-full sm:w-auto">Open</Button>
              </form>
            </Card>

            <Card className="rounded-[24px] p-5">
              <p className="text-lg font-medium text-primary">Created PayLinks</p>
              <div className="mt-4 space-y-4">
                {links.length ? (
                  links.map((link) => (
                    <div
                      key={link.tag}
                      className="rounded-2xl border border-border bg-background/60 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-primary">
                            {link.ownerTag ? `@${link.ownerTag}` : link.tag}
                          </p>
                          <p className="text-sm text-secondary">
                            {link.amount ? `${link.amount} ${link.token}` : "Custom amount"}
                          </p>
                        </div>
                        <Link href={`/pay/${link.tag}`}>
                          <Button variant="secondary" className="w-full sm:w-auto">
                            Open PayLink
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-secondary">No PayLinks created yet.</p>
                )}
              </div>
            </Card>

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
