"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  LoaderCircle,
  MessageCircle,
  Shield
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

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
    const whatsappUrl = buildWhatsAppShareUrl(createdLink.url, createdLink.link.tag);
    const xUrl = buildXShareUrl(createdLink.url, createdLink.link.tag);

    return (
      <div className="mx-auto w-full max-w-xl pt-8 sm:pt-12">
        <div className="relative rounded-[34px] border border-border bg-card/95 px-6 pb-6 pt-20 shadow-[0_30px_120px_rgba(0,0,0,0.5)] sm:px-8 sm:pb-8 sm:pt-24">
          <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <TokenBadge token={createdLink.link.token} />
            <span className="mt-3 inline-flex items-center rounded-full bg-[#22C55E] px-4 py-1 text-xs font-semibold tracking-[0.18em] text-black">
              ACTIVE
            </span>
          </div>

          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <p className="text-xs uppercase tracking-[0.34em] text-secondary">
                Payment Request
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
                {createdLink.link.amount ?? "Custom"}{" "}
                <span className="text-4xl font-medium text-primary/90 sm:text-5xl">
                  {createdLink.link.token}
                </span>
              </h1>
            </div>

            <div className="border-t border-border/80" />

            <div className="space-y-5 text-sm text-secondary">
              <PreviewRow label="Ref ID" value={createdLink.link.tag} />
              <PreviewRow
                label="Link"
                value={createdLink.url.replace(/^https?:\/\//, "")}
                compact
              />
              <PreviewRow
                label="Creator"
                value="Hidden"
                icon={<EyeOff className="h-4 w-4 text-accent" />}
              />
              <PreviewRow
                label="Status"
                value="Private"
                icon={<Shield className="h-4 w-4 text-accent" />}
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <ShareCircle href={xUrl} label="Share on X">
                <span className="text-lg font-medium">X</span>
              </ShareCircle>
              <ShareCircle href={whatsappUrl} label="Share on WhatsApp">
                <MessageCircle className="h-5 w-5" />
              </ShareCircle>
              <button
                type="button"
                aria-label="Copy PayLink"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>

            <Link href={`/${createdLink.link.tag}`}>
              <Button className="h-16 w-full rounded-[22px] text-xl font-medium">
                Pay Now
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>

            <p className="text-center text-sm text-secondary">Powered by Privii</p>
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

function TokenBadge({ token }: { token: PayLinkToken }) {
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-[#171717] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB] text-3xl font-semibold text-white">
        {token === "USDC" ? "$" : "S"}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  icon,
  compact = false
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span
        className={`flex items-center gap-2 text-right text-primary ${compact ? "max-w-[210px] truncate sm:max-w-[260px]" : ""}`}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}

function ShareCircle({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      {children}
    </a>
  );
}
