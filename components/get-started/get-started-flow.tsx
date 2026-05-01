"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { EvmConnectWalletButton } from "@/components/evm/connect-wallet-button";
import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { useOwnerTag } from "@/components/solana/use-owner-tag";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import type { WalletType } from "@/lib/types";
import { isValidPriviiTag, normalizePriviiTag, truncateWalletAddress } from "@/lib/utils";

export function GetStartedFlow() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { showToast } = useToast();
  const { tagRecord, hasTag, isLoading: isTagLoading } = useOwnerTag();
  const solanaAddress = publicKey?.toBase58() ?? "";
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType | null>(null);
  const [tag, setTag] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  const normalizedTag = normalizePriviiTag(tag);
  const isTagValid = isValidPriviiTag(normalizedTag);
  const tagPreview = normalizedTag ? `${normalizedTag}.privii.cash` : "prince.privii.cash";
  const isSelectedWalletConnected =
    selectedWalletType === "solana"
      ? connected && Boolean(solanaAddress)
      : selectedWalletType === "evm"
        ? evmConnected && Boolean(evmAddress)
        : false;
  const connectedAddress =
    selectedWalletType === "solana"
      ? solanaAddress
      : selectedWalletType === "evm"
        ? evmAddress ?? ""
        : "";
  const currentStep = justCreated ? 4 : !selectedWalletType ? 1 : isSelectedWalletConnected ? 3 : 2;

  useEffect(() => {
    if (hasTag && tagRecord && !justCreated) {
      router.replace("/dashboard");
    }
  }, [hasTag, justCreated, router, tagRecord]);

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

    if (!selectedWalletType || !connectedAddress || !isTagValid) {
      setError("Connect at least one wallet to continue");
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
          walletType: selectedWalletType,
          ownerWallet: connectedAddress,
          solanaWallet: selectedWalletType === "solana" ? connectedAddress : null,
          evmWallet: selectedWalletType === "evm" ? connectedAddress : null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create your Privii tag.");
      }

      setJustCreated(true);
      showToast("Your Privii is live");
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create your Privii tag."
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
      return "This Privii tag is already taken";
    }

    if (availability === "available") {
      return "That Privii tag is available.";
    }

    return "Choose the payment identity you want people to remember.";
  }, [availability, isTagValid, normalizedTag]);

  if ((connected || evmConnected) && isTagLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="rounded-[32px] p-6 sm:p-8">
          <p className="text-sm text-secondary">Checking your Privii setup...</p>
        </Card>
      </div>
    );
  }

  if ((connected || evmConnected) && hasTag && !justCreated) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="rounded-[32px] p-6 sm:p-8">
          <p className="text-sm text-secondary">Opening your dashboard...</p>
        </Card>
      </div>
    );
  }

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
            Choose one wallet path, claim your tag, and start receiving payments.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <StepChip number="1" label="Choose wallet" active={currentStep === 1} done={currentStep > 1} />
          <StepChip number="2" label="Connect wallet" active={currentStep === 2} done={currentStep > 2} />
          <StepChip number="3" label="Choose tag" active={currentStep === 3} done={currentStep > 3} />
          <StepChip number="4" label="Go live" active={currentStep === 4} done={currentStep === 4} />
        </div>

        {currentStep === 1 ? (
          <div className="mt-8 rounded-[28px] border border-border bg-background/60 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 1</p>
            <h2 className="mt-3 text-2xl font-semibold">Choose wallet</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Pick the wallet ecosystem you want this Privii tag to use.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-2xl border p-5 text-left transition ${
                  selectedWalletType === "solana"
                    ? "border-accent/30 bg-accent/10"
                    : "border-border bg-card/70 hover:border-white/15"
                }`}
                onClick={() => setSelectedWalletType("solana")}
              >
                <p className="text-lg font-medium text-primary">Solana wallet</p>
                <p className="mt-2 text-sm text-secondary">
                  Phantom, Solflare, Backpack, Glow
                </p>
              </button>
              <button
                type="button"
                className={`rounded-2xl border p-5 text-left transition ${
                  selectedWalletType === "evm"
                    ? "border-accent/30 bg-accent/10"
                    : "border-border bg-card/70 hover:border-white/15"
                }`}
                onClick={() => setSelectedWalletType("evm")}
              >
                <p className="text-lg font-medium text-primary">EVM wallet</p>
                <p className="mt-2 text-sm text-secondary">
                  MetaMask, Trust Wallet, WalletConnect-compatible wallets
                </p>
              </button>
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="mt-8 rounded-[28px] border border-border bg-background/60 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 2</p>
            <h2 className="mt-3 text-2xl font-semibold">Connect wallet</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              {selectedWalletType === "solana"
                ? "Connect your Solana wallet to continue."
                : "Connect your EVM wallet to continue."}
            </p>
            <div className="mt-6">
              {selectedWalletType === "solana" ? (
                <ConnectWalletButton className="!w-full sm:!w-auto" />
              ) : (
                <EvmConnectWalletButton className="!w-full sm:!w-auto" />
              )}
            </div>
            {!isSelectedWalletConnected ? (
              <p className="mt-4 text-sm text-secondary">Connect at least one wallet to continue</p>
            ) : null}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <form
            className="mt-8 rounded-[28px] border border-border bg-background/60 p-6 sm:p-7"
            onSubmit={handleSubmit}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 3</p>
            <h2 className="mt-3 text-2xl font-semibold">Choose your Privii tag</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Connected as {truncateWalletAddress(connectedAddress)}.
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
              disabled={!isSelectedWalletConnected || !isTagValid || availability === "taken" || isSubmitting}
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

        {currentStep === 4 ? (
          <div className="mt-8 rounded-[28px] border border-border bg-background/60 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Step 4</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your Privii is live</h2>
            <div className="mt-6 rounded-[24px] border border-border bg-card/70 p-5">
              <p className="text-base text-secondary">Redirecting to your dashboard...</p>
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
