"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Check, Copy, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import type { PriviiTagRecord } from "@/lib/types";
import { isValidPriviiTag, normalizePriviiTag, truncateWalletAddress } from "@/lib/utils";

export function GetStartedFlow() {
  const { publicKey, connected } = useWallet();
  const { showToast } = useToast();
  const walletAddress = publicKey?.toBase58() ?? "";
  const [tag, setTag] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTag, setCreatedTag] = useState<PriviiTagRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const normalizedTag = normalizePriviiTag(tag);
  const isTagValid = isValidPriviiTag(normalizedTag);
  const tagPreview = normalizedTag ? `${normalizedTag}.privii.cash` : "prince.privii.cash";
  const currentStep = createdTag ? 3 : connected ? 2 : 1;

  useEffect(() => {
    async function fetchOwnerTag() {
      if (!walletAddress) {
        return;
      }

      const response = await fetch(`/api/tags/by-owner/${encodeURIComponent(walletAddress)}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as { tag: PriviiTagRecord };
      setCreatedTag(result.tag);
      setTag(result.tag.tag);
      setAvailability("available");
    }

    fetchOwnerTag();
  }, [walletAddress]);

  useEffect(() => {
    async function checkTag() {
      if (!normalizedTag || !isTagValid || createdTag?.tag === normalizedTag) {
        setAvailability("idle");
        return;
      }

      setAvailability("checking");

      const response = await fetch(`/api/tags/${normalizedTag}`, {
        cache: "no-store"
      });

      setAvailability(response.ok ? "taken" : "available");
    }

    const timeout = window.setTimeout(checkTag, 300);
    return () => window.clearTimeout(timeout);
  }, [createdTag?.tag, isTagValid, normalizedTag]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!walletAddress || !isTagValid) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tags/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tag: normalizedTag,
          ownerWallet: walletAddress
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to register Privii tag.");
      }

      setCreatedTag(result.tag);
      showToast("Your Privii is live");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to register Privii tag."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!createdTag) {
      return;
    }

    await navigator.clipboard.writeText(createdTag.fallbackUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const availabilityCopy = useMemo(() => {
    if (!normalizedTag) {
      return "Choose the payment identity you want people to remember.";
    }

    if (!isTagValid) {
      return "Use 3-24 lowercase letters, numbers, or hyphens.";
    }

    if (availability === "checking") {
      return "Checking availability...";
    }

    if (availability === "taken") {
      return "That Privii tag is already taken.";
    }

    if (availability === "available") {
      return "That Privii tag is available.";
    }

    return "Choose the payment identity you want people to remember.";
  }, [availability, isTagValid, normalizedTag]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="rounded-[32px] p-6 sm:p-8">
        <div className="space-y-3">
          <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-accent">
            Get started
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Register your Privii tag
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-secondary sm:text-base">
            Connect your wallet, choose a tag, and start receiving crypto without
            exposing your wallet address in the UI.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StepChip number="1" label="Connect wallet" active={currentStep === 1} done={currentStep > 1} />
          <StepChip number="2" label="Choose tag" active={currentStep === 2} done={currentStep > 2} />
          <StepChip number="3" label="Go live" active={currentStep === 3} done={currentStep === 3} />
        </div>

        {currentStep === 1 ? (
          <div className="mt-8 rounded-[28px] border border-border bg-background/60 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 1</p>
            <h2 className="mt-3 text-2xl font-semibold">Connect wallet</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Connect any supported Solana wallet to reserve your Privii tag.
            </p>
            <div className="mt-6">
              <ConnectWalletButton />
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <form
            className="mt-8 rounded-[28px] border border-border bg-background/60 p-6 sm:p-7"
            onSubmit={handleSubmit}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 2</p>
            <h2 className="mt-3 text-2xl font-semibold">Choose your Privii tag</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Connected as {truncateWalletAddress(walletAddress)}.
            </p>

            <label className="mt-6 block space-y-2">
              <span className="text-sm text-secondary">Choose your Privii tag</span>
              <Input
                placeholder="prince"
                value={tag}
                maxLength={24}
                onChange={(event) =>
                  setTag(event.target.value.toLowerCase().replace(/\s+/g, ""))
                }
              />
            </label>

            <div className="mt-5 rounded-2xl border border-border bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">Preview</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{tagPreview}</p>
            </div>

            <p
              className={`mt-4 text-sm ${
                availability === "taken"
                  ? "text-red-400"
                  : availability === "available"
                    ? "text-[#22C55E]"
                    : "text-secondary"
              }`}
            >
              {availabilityCopy}
            </p>

            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

            <Button
              className="mt-6 w-full"
              disabled={!isTagValid || availability === "taken" || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Registering...
                </span>
              ) : (
                "Get Started"
              )}
            </Button>
          </form>
        ) : null}

        {currentStep === 3 && createdTag ? (
          <div className="mt-8 rounded-[28px] border border-border bg-background/60 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 3</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your Privii is live</h2>
            <div className="mt-6 space-y-4 rounded-[24px] border border-border bg-card/70 p-5">
              <IdentityRow label="Primary identity" value={`${createdTag.tag}.privii.cash`} />
              <IdentityRow label="Fallback link" value={`privii.xyz/${createdTag.tag}`} />
            </div>

            <div className="mt-6 space-y-4">
              <Button className="w-full" onClick={handleCopy}>
                {copied ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Privii tag link
                  </span>
                )}
              </Button>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link href={`/${createdTag.tag}`}>
                  <Button variant="secondary" className="w-full">
                    View my Privii
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function StepChip({
  number,
  label,
  active,
  done
}: {
  number: string;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        active
          ? "border-accent/30 bg-accent/10"
          : done
            ? "border-white/12 bg-white/[0.04]"
            : "border-border bg-card/50"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{number}</p>
      <p className="mt-2 text-sm font-medium text-primary">{label}</p>
    </div>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{label}</p>
      <p className="break-all text-base font-medium text-primary">{value}</p>
    </div>
  );
}
