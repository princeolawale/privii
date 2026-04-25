"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Shield,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import type { PayLinkExpiryOption, PayLinkToken, PayLinkType } from "@/lib/types";
import {
  buildPaymentUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
  formatAmount
} from "@/lib/utils";

type CreateResponse = {
  link: {
    tag: string;
    amount: string | null;
    token: PayLinkToken;
    expiresAt?: number | null;
  };
  url: string;
};

export function V2CreateForm() {
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

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (createdLink) {
    const liveUrl = buildPaymentUrl(createdLink.link.tag);
    const previewUrl = `/v2/pay/${createdLink.link.tag}`;
    const whatsappUrl = buildWhatsAppShareUrl(liveUrl, createdLink.link.tag);
    const xUrl = buildXShareUrl(liveUrl, createdLink.link.tag);

    return (
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              V2 preview ready
            </span>
            <Link href="/v2/create">
              <Button variant="ghost" className="rounded-full px-4 py-2">
                Create another
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[30px] border border-white/10 bg-[#0B0C12] p-6">
              <div className="mb-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.32em] text-secondary">
                  Privii v2 payment request
                </p>
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-primary sm:text-5xl">
                  {formatAmount(createdLink.link.amount, createdLink.link.token)}
                </h1>
                <p className="text-sm text-secondary">
                  This uses the same working KV + Solana backend, wrapped in the new
                  visual frontend.
                </p>
              </div>

              <div className="space-y-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <InfoRow label="Tag" value={`@${createdLink.link.tag}`} />
                <InfoRow label="Live link" value={liveUrl.replace(/^https?:\/\//, "")} />
                <InfoRow label="Recipient" value="Hidden" />
                <InfoRow label="Status" value="Private / Active" />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <IconLink href={xUrl} label="Share on X">
                  X
                </IconLink>
                <IconLink href={whatsappUrl} label="Share on WhatsApp">
                  <MessageCircle className="h-5 w-5" />
                </IconLink>
                <button
                  type="button"
                  aria-label="Copy link"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary transition hover:bg-white/[0.08]"
                  onClick={() => handleCopy(liveUrl)}
                >
                  {copied ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>

              <div className="mt-8">
                <Link href={previewUrl}>
                  <Button className="h-14 w-full rounded-[20px] text-lg">
                    Open v2 pay page
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.2),transparent_40%),#090A0F] p-6">
              <p className="mb-4 text-sm uppercase tracking-[0.24em] text-secondary">
                Compare
              </p>
              <div className="space-y-4 text-sm text-secondary">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="mb-2 text-primary">Working backend</p>
                  <p>Uses the existing create API, KV storage, tag validation, and payment flow unchanged.</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="mb-2 text-primary">Testable separately</p>
                  <p>The new pages live under `/v2`, so we can compare them with the current app before switching.</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="mb-2 text-primary">Ready to promote</p>
                  <p>Once this looks right, we can swap `/`, `/create`, and payment surfaces over without rewriting the backend.</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link href="/">
                  <Button variant="secondary" className="rounded-full px-5 py-2.5">
                    Current UI
                  </Button>
                </Link>
                <a href={liveUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="rounded-full px-5 py-2.5">
                    Live route
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-8 lg:sticky lg:top-28">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-accent">
            <Shield className="h-3.5 w-3.5" />
            Second frontend version
          </span>
          <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.06em] text-primary sm:text-6xl">
            Build a new Privii surface on the same backend.
          </h1>
          <p className="max-w-lg text-base leading-7 text-secondary">
            This version rethinks the front-end experience while keeping the exact
            same working APIs, KV storage, wallet adapter support, and payment logic.
          </p>
        </div>

        <div className="grid gap-3">
          <Feature title="Same create API" copy="Still posts to `/api/links/create` and stores records in Vercel KV." />
          <Feature title="Same pay fetch" copy="Still resolves tags through the existing `GET /api/links/[slug]` route." />
          <Feature title="Same wallet + payment flow" copy="Still uses the current Solana adapter setup and transaction logic." />
        </div>
      </section>

      <section className="rounded-[34px] border border-white/10 bg-[#0A0B10]/95 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">
            Create V2 PayLink
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Privii tag">
              <InputV2
                placeholder="defi-prince"
                value={tag}
                onChange={(event) => setTag(event.target.value.toLowerCase())}
              />
            </Field>
            <Field label="Amount (optional)">
              <InputV2
                inputMode="decimal"
                placeholder="25"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Token">
              <SelectV2
                value={token}
                onChange={(event) => setToken(event.target.value as PayLinkToken)}
              >
                <option value="USDC">USDC</option>
                <option value="SOL">SOL</option>
              </SelectV2>
            </Field>
            <Field label="Type">
              <SelectV2
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
              </SelectV2>
            </Field>
          </div>

          <Field label="Expiry">
            <SelectV2
              disabled={type === "permanent"}
              value={type === "permanent" ? "none" : expiry}
              onChange={(event) => setExpiry(event.target.value as PayLinkExpiryOption)}
            >
              <option value="none">None</option>
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
            </SelectV2>
          </Field>

          <Field label="Recipient wallet">
            <InputV2
              disabled
              value={connected ? recipientWallet : ""}
              placeholder="Connect wallet from the header to autofill"
            />
          </Field>

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

          <Button className="h-14 w-full rounded-[20px] text-lg" disabled={!canCreate}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                Create PayLink
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-secondary">{label}</span>
      {children}
    </label>
  );
}

function Feature({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-2 text-base font-medium text-primary">{title}</p>
      <p className="text-sm leading-6 text-secondary">{copy}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-secondary">{label}</span>
      <span className="max-w-[220px] text-right text-primary sm:max-w-[320px]">{value}</span>
    </div>
  );
}

function IconLink({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary transition hover:bg-white/[0.08]"
    >
      {children}
    </a>
  );
}

function InputV2(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base text-primary outline-none transition placeholder:text-secondary/70 focus:border-accent focus:bg-white/[0.05] ${props.className ?? ""}`}
    />
  );
}

function SelectV2(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base text-primary outline-none transition focus:border-accent focus:bg-white/[0.05] ${props.className ?? ""}`}
    />
  );
}
