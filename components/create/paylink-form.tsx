"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, Check, Copy, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import type { PayLinkExpiryOption, PayLinkToken, PayLinkType } from "@/lib/types";

type CreateResponse = {
  link: {
    tag: string;
    amount: string | null;
    token: PayLinkToken;
  };
  url: string;
};

export function PayLinkForm() {
  const { publicKey, connected } = useWallet();
  const { showToast } = useToast();
  const [tag, setTag] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<PayLinkToken>("USDC");
  const [type, setType] = useState<PayLinkType>("permanent");
  const [expiry, setExpiry] = useState<PayLinkExpiryOption>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const recipientWallet = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);
  const normalizedTag = tag.trim().toLowerCase();
  const isTagValid = /^[a-z0-9-]{3,32}$/.test(normalizedTag);
  const canCreate = connected && Boolean(recipientWallet) && isTagValid && !isLoading;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) {
      return;
    }

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
          tag: normalizedTag,
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
      setTag(data.link.tag);
      showToast("PayLink created successfully");
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

  if (createdLink) {
    const cleanUrl = createdLink.url.replace(/^https?:\/\//, "");

    return (
      <div className="mx-auto w-full max-w-6xl pt-4 sm:pt-8">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-8">
            <p className="text-sm uppercase tracking-[0.34em] text-[#3366FF]">
              Payment link ready
            </p>
            <div className="space-y-2">
              <h1 className="text-6xl font-semibold tracking-[-0.08em] text-primary sm:text-7xl">
                Link
              </h1>
              <h2 className="text-6xl font-semibold italic tracking-[-0.08em] text-[#3366FF] sm:text-7xl">
                Created.
              </h2>
            </div>
            <p className="max-w-xl text-xl leading-9 text-secondary">
              Share this link to receive payment. Payers will never see your wallet
              address at any point in the flow.
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-[30px] border border-[#1C3FA8]/60 bg-[#0A0C15]/90 p-4 sm:p-5">
              <div className="flex items-center gap-4 rounded-[24px] border border-[#1C3FA8]/60 bg-[#090C16] p-5">
                <p className="min-w-0 flex-1 break-all font-mono text-lg text-[#3366FF] sm:text-2xl">
                  {cleanUrl}
                </p>
                <button
                  type="button"
                  className="inline-flex h-16 min-w-[128px] items-center justify-center rounded-[22px] border border-[#2750D3] bg-[#0E1220] px-6 text-xl font-semibold text-[#3366FF] transition hover:bg-[#131A2D]"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      Copied
                    </span>
                  ) : (
                    "COPY"
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link href={`/${createdLink.link.tag}`}>
                <Button
                  variant="secondary"
                  className="h-20 w-full rounded-[28px] border-white/10 bg-[#151923] text-2xl font-medium text-primary hover:bg-[#1A1F2B]"
                >
                  Preview
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>

              <button
                type="button"
                className="inline-flex h-20 w-full items-center justify-center rounded-[28px] bg-[#3366FF] px-6 text-2xl font-semibold text-white transition hover:bg-[#2b58e5]"
                onClick={() => {
                  setCreatedLink(null);
                  setCopied(false);
                  setAmount("");
                  setTag("");
                  setToken("USDC");
                  setType("permanent");
                  setExpiry("none");
                  setError(null);
                }}
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="p-5 sm:p-8">
        <div className="mb-8 space-y-3">
          <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-accent">
            Create Privii link
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Create a PayLink</h1>
          <p className="max-w-xl text-sm leading-6 text-secondary">
            Pick your Privii tag, set the payment details, and publish a private link
            that anyone can use to pay you.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-secondary">Privii tag</span>
              <Input
                placeholder="ola"
                value={tag}
                onChange={(event) => setTag(event.target.value.toLowerCase())}
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
            <Input
              disabled
              value={connected ? recipientWallet : ""}
              placeholder="Wallet autofills when connected"
            />
          </label>

          {!connected ? (
            <p className="text-sm text-secondary">
              Connect wallet from the header to autofill recipient.
            </p>
          ) : null}

          {!isTagValid && normalizedTag.length > 0 ? (
            <p className="text-sm text-secondary">
              Use 3-32 lowercase letters, numbers, or hyphens.
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button className="w-full" disabled={!canCreate}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create PayLink"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
