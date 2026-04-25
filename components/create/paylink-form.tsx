"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Copy, ExternalLink, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PayLinkExpiryOption, PayLinkToken, PayLinkType } from "@/lib/types";

type CreateResponse = {
  link: {
    slug: string;
  };
  url: string;
};

export function PayLinkForm() {
  const { publicKey, connected } = useWallet();
  const [slug, setSlug] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<PayLinkToken>("USDC");
  const [type, setType] = useState<PayLinkType>("permanent");
  const [expiry, setExpiry] = useState<PayLinkExpiryOption>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const recipientWallet = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    setCreatedLink(null);

    try {
      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          slug,
          amount: amount || null,
          token,
          type,
          expiry: type === "expiring" ? expiry : "none",
          recipientWallet
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create PayLink.");
      }

      setCreatedLink(data);
      setSlug(data.link.slug);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!createdLink?.url) {
      return;
    }

    await navigator.clipboard.writeText(createdLink.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5 sm:p-7">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Create a PayLink</h1>
          <p className="max-w-xl text-sm text-secondary">
            Spin up a reusable or expiring payment link in seconds. The recipient
            wallet stays off the public UI.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-secondary">Slug</span>
              <Input
                placeholder="alex-pay"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-secondary">Amount (optional)</span>
              <Input
                inputMode="decimal"
                placeholder="25"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-secondary">Token</span>
              <Select
                value={token}
                onChange={(event) => setToken(event.target.value as PayLinkToken)}
              >
                <option value="USDC">USDC</option>
                <option value="SOL">SOL</option>
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-secondary">Type</span>
              <Select
                value={type}
                onChange={(event) => {
                  const nextType = event.target.value as PayLinkType;
                  setType(nextType);
                  if (nextType === "permanent") {
                    setExpiry("none");
                  }
                }}
              >
                <option value="permanent">Permanent</option>
                <option value="expiring">Expiring</option>
              </Select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm text-secondary">Expiry</span>
            <Select
              disabled={type === "permanent"}
              value={type === "permanent" ? "none" : expiry}
              onChange={(event) => setExpiry(event.target.value as PayLinkExpiryOption)}
            >
              <option value="none">None</option>
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-secondary">Recipient wallet</span>
            <Input disabled value={connected ? recipientWallet : "Connect Phantom to autofill"} />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button className="w-full" disabled={!connected || !recipientWallet || isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Creating link
              </span>
            ) : (
              "Create PayLink"
            )}
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="space-y-4 p-5 sm:p-7">
          <div className="space-y-2">
            <p className="text-sm text-secondary">What gets shared</p>
            <p className="text-lg font-medium text-primary">A clean payment page, not your wallet address.</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-secondary">
            Anyone with the link can pay in one flow. They see the amount, token,
            status, and expiry details without the recipient address being exposed in
            the interface.
          </div>
        </Card>

        <Card className="space-y-4 p-5 sm:p-7">
          <div className="space-y-2">
            <p className="text-sm text-secondary">Live link</p>
            <p className="break-all text-sm text-primary">
              {createdLink?.url || "Create a link to generate a shareable URL."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={!createdLink}
              onClick={handleCopy}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied" : "Copy link"}
            </Button>

            <Link
              href={createdLink ? `/pay/${createdLink.link.slug}` : "/create"}
              className="flex-1"
            >
              <Button type="button" variant="secondary" className="w-full" disabled={!createdLink}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
