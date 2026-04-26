"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  LoaderCircle,
  Send,
  Shield
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useOwnerTag } from "@/components/solana/use-owner-tag";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import type { PayLinkExpiryOption, PayLinkToken, PayLinkType } from "@/lib/types";
import { buildWhatsAppShareUrl, buildXShareUrl } from "@/lib/utils";

type CreateResponse = {
  link: {
    tag: string;
    amount: string | null;
    token: PayLinkToken;
    type: PayLinkType;
    expiresAt: number | null;
    creatorTag?: string | null;
    ownerTag?: string | null;
    paymentPurpose?: string | null;
  };
  url: string;
};

export function PayLinkForm() {
  const { publicKey, connected } = useWallet();
  const { tagRecord, hasTag, isLoading: isTagLoading } = useOwnerTag();
  const { showToast } = useToast();
  const [paymentPurpose, setPaymentPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<PayLinkToken>("USDC");
  const [type, setType] = useState<PayLinkType>("permanent");
  const [expiry, setExpiry] = useState<PayLinkExpiryOption>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const creatorWallet = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);
  const recipientWallet =
    tagRecord?.recipientWallet?.trim() || tagRecord?.ownerWallet?.trim() || "";
  const canCreate =
    connected && hasTag && Boolean(creatorWallet) && Boolean(recipientWallet) && !isLoading;

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
          amount: amount || null,
          token,
          type,
          expiry: type === "expiring" ? expiry : "none",
          creatorWallet,
          paymentPurpose
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create PayLink.");
      }

      setCreatedLink(data);
      showToast("PayLink created successfully");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create PayLink."
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

  async function handleShare() {
    if (!createdLink?.url) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Privii PayLink",
          text: `Pay me privately with my Privii link (@${createdLink.link.tag})`,
          url: createdLink.url
        });
        return;
      } catch {
        // Fall back to copy when native share is dismissed or unavailable.
      }
    }

    await handleCopy();
  }

  if (createdLink) {
    const whatsappUrl = buildWhatsAppShareUrl(createdLink.url, createdLink.link.tag);
    const xUrl = buildXShareUrl(createdLink.url, createdLink.link.tag);
    const amountLabel = createdLink.link.amount
      ? `${createdLink.link.amount} ${createdLink.link.token}`
      : "Custom amount";
    const purposeLabel = createdLink.link.paymentPurpose || "General payment";
    const linkTypeLabel =
      createdLink.link.type === "permanent" ? "Permalink" : "Expiring link";
    const expiryLabel =
      createdLink.link.type === "permanent"
        ? "No expiry"
        : formatExpiryLabel(createdLink.link.expiresAt);

    return (
      <div className="mx-auto w-full max-w-xl pt-12 sm:pt-16">
        <div className="relative rounded-[34px] border border-border bg-card/95 px-6 pb-8 pt-24 shadow-[0_30px_120px_rgba(0,0,0,0.5)] sm:px-8 sm:pb-10 sm:pt-28">
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
                {createdLink.link.amount ? createdLink.link.amount : "Custom"}{" "}
                <span className="text-4xl font-medium text-primary/90 sm:text-5xl">
                  {createdLink.link.amount ? createdLink.link.token : "amount"}
                </span>
              </h1>
            </div>

            <div className="border-t border-border/80" />

            <div className="space-y-6 text-sm text-secondary">
              <PreviewRow
                label={createdLink.link.ownerTag ? "User tag" : "Ref ID"}
                value={createdLink.link.ownerTag ? `@${createdLink.link.ownerTag}` : createdLink.link.tag}
              />
              <PreviewRow label="Payment purpose" value={purposeLabel} />
              <PreviewRow label="Amount" value={amountLabel} />
              <PreviewRow label="Link type" value={linkTypeLabel} />
              <PreviewRow label="Expiry" value={expiryLabel} />
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

            <div className="flex items-center justify-center gap-4 pt-6">
              <ShareCircle href={xUrl} label="Share on X">
                <span className="text-base font-medium">X</span>
              </ShareCircle>
              <ShareCircle href={whatsappUrl} label="Share on WhatsApp">
                <Send className="h-4 w-4" />
              </ShareCircle>
              <button
                type="button"
                aria-label="Copy PayLink"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <Button
              className="mt-8 w-full"
              onClick={handleShare}
            >
              Share PayLink
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>

            <Link
              href={`/pay/${createdLink.link.tag}`}
              className="block text-center text-sm text-secondary transition hover:text-primary"
            >
              Preview payment page
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
            One-time PayLink
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Create one-time PayLink
          </h1>
          <p className="max-w-xl text-sm leading-6 text-secondary">
            This link will receive payments through your registered payment tag.
          </p>
        </div>

        {!connected ? (
          <div className="space-y-4">
            <p className="text-sm text-secondary">Please connect your wallet first</p>
          </div>
        ) : null}

        {connected && isTagLoading ? (
          <p className="text-sm text-secondary">Loading your payment tag</p>
        ) : null}

        {connected && !isTagLoading && !hasTag ? (
          <div className="space-y-4">
            <p className="text-sm text-secondary">Create your payment tag first.</p>
            <Link href="/get-started" className="inline-flex">
              <Button>Create your payment tag first</Button>
            </Link>
          </div>
        ) : null}

        {connected && hasTag ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-secondary">Payment purpose</span>
                <Input
                  placeholder="Invoice"
                  value={paymentPurpose}
                  onChange={(event) => setPaymentPurpose(event.target.value)}
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
              <span className="text-sm text-secondary">Registered payment tag</span>
              <Input
                disabled
                value={hasTag && tagRecord ? `@${tagRecord.tag}` : ""}
                placeholder="Register a payment tag to create links"
              />
            </label>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <Button className="w-full" disabled={!canCreate}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Link"
              )}
            </Button>
          </form>
        ) : null}
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      {children}
    </a>
  );
}

function formatExpiryLabel(expiresAt: number | null) {
  if (!expiresAt) {
    return "No expiry";
  }

  const diff = expiresAt - Date.now();

  if (diff <= 0) {
    return "Expires soon";
  }

  const minutes = Math.floor(diff / (60 * 1000));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return `Expires in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Expires in ${hours}h ${remainingMinutes}m`;
  }

  return remainingMinutes <= 5 ? "Expires soon" : `Expires in ${remainingMinutes}m`;
}
