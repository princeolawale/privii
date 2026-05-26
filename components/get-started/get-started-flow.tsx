"use client";

import { useAppKitNetwork, useAppKitState } from "@reown/appkit/react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useOwnerTag } from "@/components/solana/use-owner-tag";
import { ConnectMenuButton } from "@/components/wallet/connect-menu-button";
import { useConnectedWallets } from "@/components/wallet/use-connected-wallets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { isValidPriviiTag, normalizePriviiTag, truncateWalletAddress } from "@/lib/utils";

export function GetStartedFlow() {
  const router = useRouter();
  const { chainId } = useAppKitNetwork();
  const { activeChain } = useAppKitState();
  const { showToast } = useToast();
  const { tagRecord, hasTag, isLoading: isTagLoading } = useOwnerTag();
  const {
    anyWalletConnected,
    primaryWalletAddress,
    primaryWalletType
  } = useConnectedWallets();
  const [tag, setTag] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  const normalizedTag = normalizePriviiTag(tag);
  const isTagValid = isValidPriviiTag(normalizedTag);
  const tagPreview = normalizedTag ? `${normalizedTag}.clinks.one` : "prince.clinks.one";
  const currentStep = justCreated ? 3 : anyWalletConnected ? 2 : 1;
  const resolvedWalletType =
    primaryWalletType ||
    (activeChain === "eip155" ? "evm" : activeChain === "solana" ? "solana" : null);

  useEffect(() => {
    if (hasTag && tagRecord && !justCreated) {
      showToast("Redirecting to your dashboard");
      router.replace("/dashboard");
    }
  }, [hasTag, justCreated, router, showToast, tagRecord]);

  useEffect(() => {
    async function checkTag() {
      if (!normalizedTag || !isTagValid || tagRecord?.tag === normalizedTag) {
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
  }, [tagRecord?.tag, isTagValid, normalizedTag]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!primaryWalletAddress || !resolvedWalletType) {
      setError("Connect at least one wallet to continue");
      return;
    }

    if (!isTagValid) {
      setError("Use lowercase letters, numbers, or hyphens only");
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
          walletType: resolvedWalletType,
          chainId: chainId ?? (resolvedWalletType === "solana" ? "solana:mainnet" : null),
          ownerWallet: primaryWalletAddress,
          solanaWallet: resolvedWalletType === "solana" ? primaryWalletAddress : null,
          evmWallet: resolvedWalletType === "evm" ? primaryWalletAddress : null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 && result.tag) {
          showToast("This wallet already has a Clinks tag");
          showToast("Redirecting to your dashboard");
          router.replace("/dashboard");
          return;
        }

        throw new Error(result.error || "Unable to create your Clinks tag.");
      }

      setJustCreated(true);
      showToast("Your Clinks is live");
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create your Clinks tag."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const availabilityCopy = useMemo(() => {
    if (!normalizedTag) {
      return "Choose the payment identity you want people to remember.";
    }

    if (!isTagValid) {
      return "Use lowercase letters, numbers, or hyphens only";
    }

    if (availability === "checking") {
      return "Checking availability...";
    }

    if (availability === "taken") {
      return "This Clinks tag is already taken";
    }

    if (availability === "available") {
      return "That Clinks tag is available.";
    }

    return "Choose the payment identity you want people to remember.";
  }, [availability, isTagValid, normalizedTag]);

  if (anyWalletConnected && isTagLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="rounded-[36px] p-7 sm:p-10">
          <p className="text-sm text-secondary">Checking your Clinks setup...</p>
        </Card>
      </div>
    );
  }

  if (anyWalletConnected && hasTag && !justCreated) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="rounded-[36px] p-7 sm:p-10">
          <p className="text-sm text-secondary">Opening your dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="rounded-[36px] p-7 sm:p-10">
        <div className="space-y-4">
          <div className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.18)]">
            Get started
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Register your Clinks tag
          </h1>
          <p className="max-w-2xl text-base leading-7 text-secondary">
            Connect one wallet, choose your tag, and go live in minutes.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <StepChip number="1" label="Connect wallet" active={currentStep === 1} done={currentStep > 1} />
          <StepChip number="2" label="Choose tag" active={currentStep === 2} done={currentStep > 2} />
          <StepChip number="3" label="Go live" active={currentStep === 3} done={currentStep === 3} />
        </div>

        {currentStep === 1 ? (
          <div className="mt-10 rounded-[30px] bg-card p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] sm:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 1</p>
            <h2 className="mt-3 text-2xl font-semibold">Connect wallet</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Connect Wallet opens one unified wallet modal where you can pick Solana or EVM.
            </p>
            <div className="mt-6">
              <ConnectMenuButton className="!w-full sm:!w-auto" />
            </div>
            {!anyWalletConnected ? (
              <p className="mt-4 text-sm text-secondary">
                Connect at least one wallet to continue
              </p>
            ) : null}
          </div>
        ) : null}

        {currentStep === 2 ? (
          <form
            className="mt-10 rounded-[30px] bg-card p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] sm:p-8"
            onSubmit={handleSubmit}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 2</p>
            <h2 className="mt-3 text-2xl font-semibold">Choose Clinks tag</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              This tag will be connected to your {resolvedWalletType === "evm" ? "EVM" : "Solana"} wallet.
            </p>

            <div className="mt-6 rounded-[22px] bg-card p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">Connected wallet</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-base font-medium text-primary">
                  {truncateWalletAddress(primaryWalletAddress || "")}
                </span>
                <span className="text-sm text-secondary">
                  {resolvedWalletType === "evm" ? "EVM" : "Solana"}
                </span>
              </div>
            </div>

            <label className="mt-6 block space-y-2">
              <span className="text-sm text-secondary">Choose your Clinks tag</span>
              <Input
                autoComplete="off"
                placeholder="prince"
                value={tag}
                onChange={(event) => {
                  setTag(normalizePriviiTag(event.target.value));
                  setError(null);
                }}
              />
            </label>

            <div className="mt-4 rounded-[22px] bg-card p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">Preview</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-primary">
                {tagPreview}
              </p>
            </div>

            <p
              className={`mt-3 text-sm ${
                availability === "taken"
                  ? "text-red-400"
                  : availability === "available"
                    ? "text-accent"
                    : "text-secondary"
              }`}
            >
              {availabilityCopy}
            </p>

            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

            <Button
              className="mt-6 w-full"
              disabled={isSubmitting || !primaryWalletAddress || !resolvedWalletType || !isTagValid || availability === "checking" || availability === "taken"}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating your tag...
                </span>
              ) : (
                "Go live"
              )}
            </Button>
          </form>
        ) : null}

        {currentStep === 3 ? (
          <div className="mt-10 rounded-[30px] bg-card p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] sm:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 3</p>
            <h2 className="mt-3 text-2xl font-semibold">Your Clinks is live</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Opening your dashboard now.
            </p>
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
      className={`rounded-[22px] px-4 py-4 text-sm transition ${
        active
          ? "bg-accent/10 text-primary shadow-[inset_0_0_0_1px_rgba(139,92,255,0.2)]"
          : done
            ? "bg-card text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
            : "bg-card/90 text-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.24em] text-secondary">Step {number}</p>
      <p className="mt-2 font-medium">{label}</p>
    </div>
  );
}
