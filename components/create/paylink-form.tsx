"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AtSign, Copy, ExternalLink, LoaderCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import type { PayLinkExpiryOption, PayLinkToken, PayLinkType } from "@/lib/types";
import {
  buildWhatsAppShareUrl,
  buildXShareUrl,
  formatAmount
} from "@/lib/utils";

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
          tag,
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
    const whatsappUrl = buildWhatsAppShareUrl(createdLink.url, createdLink.link.tag);
    const xUrl = buildXShareUrl(createdLink.url, createdLink.link.tag);

    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-accent">Privii PayLink</p>
                <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                  {formatAmount(createdLink.link.amount, createdLink.link.token)}
                </h1>
                <p className="text-base text-secondary">@{createdLink.link.tag}</p>
              </div>
              <div className="inline-flex w-fit rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                Active / Private
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-[24px] border border-border bg-background/80 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <PreviewItem label="Link" value={createdLink.url.replace(/^https?:\/\//, "")} />
                <PreviewItem label="Creator" value="Hidden" />
                <PreviewItem label="Status" value="Active / Private" />
                <PreviewItem label="User tag" value={`@${createdLink.link.tag}`} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button type="button" variant="secondary" className="w-full" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy link"}
              </Button>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary" className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
              <a href={xUrl} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary" className="w-full">
                  <AtSign className="mr-2 h-4 w-4" />
                  X
                </Button>
              </a>
              <Link href={`/${createdLink.link.tag}`}>
                <Button type="button" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
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
            <Input disabled value={connected ? recipientWallet : "Connect wallet to autofill"} />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {!connected ? <ConnectWalletButton className="!w-full" /> : null}

          <Button className="w-full" disabled={!connected || !recipientWallet || isLoading}>
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

      <div className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-7">
          <div className="space-y-2">
            <p className="text-sm text-secondary">Public preview</p>
            <p className="text-lg font-medium text-primary">
              A premium payment page with private recipient details.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-background/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-primary">
                {amount ? `${amount} ${token}` : `Custom ${token}`}
              </p>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                Private
              </span>
            </div>
            <div className="space-y-3 text-sm text-secondary">
              <div className="flex items-center justify-between gap-4">
                <span>User tag</span>
                <span className="text-primary">@{tag || "yourtag"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Link</span>
                <span className="text-primary">privii.xyz/{tag || "yourtag"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Creator</span>
                <span className="text-primary">Hidden</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5 sm:p-7">
          <div className="space-y-2">
            <p className="text-sm text-secondary">What happens next</p>
            <p className="text-sm leading-6 text-secondary">
              After creation, the form becomes the final Privii card so you can copy,
              share, and open the payment link immediately.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{label}</p>
      <p className="break-all text-sm font-medium text-primary">{value}</p>
    </div>
  );
}
