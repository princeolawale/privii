"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  LoaderCircle,
  MessageCircle,
  Shield
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { USDC_MINT_ADDRESS } from "@/lib/solana";
import type { PayLinkResponse, PayLinkToken } from "@/lib/types";
import {
  buildWhatsAppShareUrl,
  buildXShareUrl,
  formatAmount
} from "@/lib/utils";

type Props = {
  tag: string;
};

export function PayLinkPaymentClient({ tag }: Props) {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [data, setData] = useState<PayLinkResponse | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchLink() {
      setIsFetching(true);
      setError(null);

      try {
        const response = await fetch(`/api/links/${tag}`, {
          cache: "no-store"
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load PayLink.");
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load link.");
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    }

    fetchLink();

    return () => {
      cancelled = true;
    };
  }, [tag]);

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : `/${tag}`;

  const enteredAmount = useMemo(() => {
    if (data?.link.amount) {
      return data.link.amount;
    }

    return customAmount;
  }, [customAmount, data?.link.amount]);

  const isExpired = data?.status === "expired";
  const recipientWallet = data?.link.recipientWallet ?? null;
  const normalizedRecipientWallet = recipientWallet?.trim() ?? null;
  const connectedWalletAddress = wallet.publicKey?.toBase58().trim() ?? null;
  const isCreator =
    Boolean(connectedWalletAddress && normalizedRecipientWallet) &&
    connectedWalletAddress === normalizedRecipientWallet;
  const canPay =
    wallet.connected &&
    wallet.publicKey &&
    !isCreator &&
    !isExpired &&
    Boolean(enteredAmount) &&
    Number(enteredAmount) > 0;

  async function handleCopy() {
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handlePay() {
    if (!data?.link || !wallet.publicKey || !wallet.sendTransaction) {
      return;
    }

    const amountNumber = Number(enteredAmount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError("Enter a valid amount before paying.");
      return;
    }

    setError(null);
    setIsPaying(true);

    try {
      const recipient = new PublicKey(data.link.recipientWallet);
      const transaction = new Transaction();

      if (data.link.token === "SOL") {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: recipient,
            lamports: Math.round(amountNumber * LAMPORTS_PER_SOL)
          })
        );
      } else {
        await addUsdcTransfer({
          connection,
          transaction,
          sender: wallet.publicKey,
          recipient,
          amount: amountNumber
        });
      }

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      router.push(
        `/success?tx=${encodeURIComponent(signature)}&tag=${encodeURIComponent(
          data.link.tag
        )}`
      );
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Transaction failed."
      );
    } finally {
      setIsPaying(false);
    }
  }

  if (isFetching) {
    return (
      <Card className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 text-secondary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading PayLink
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold">Link unavailable</h1>
        <p className="text-sm text-secondary">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const whatsappUrl = buildWhatsAppShareUrl(currentUrl, data.link.tag);
  const xUrl = buildXShareUrl(currentUrl, data.link.tag);
  const amountLabel = data.link.amount
    ? formatAmount(data.link.amount, data.link.token)
    : "Custom Amount";
  const linkTypeLabel = data.link.type === "permanent" ? "Permalink" : "Expiring";
  const expiryLabel =
    data.link.type === "permanent"
      ? "Permanent"
      : formatExpiryCountdown(data.link.expiresAt);

  return (
    <div className="mx-auto w-full max-w-xl pt-8 sm:pt-12">
      <div className="relative rounded-[34px] border border-border bg-card/95 px-6 pb-8 pt-24 shadow-[0_30px_120px_rgba(0,0,0,0.5)] sm:px-8 sm:pb-10 sm:pt-28">
        <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <TokenBadge token={data.link.token} />
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
              {amountLabel === "Custom Amount" ? "Custom" : data.link.amount}{" "}
              <span className="text-4xl font-medium text-primary/90 sm:text-5xl">
                {amountLabel === "Custom Amount" ? "Amount" : data.link.token}
              </span>
            </h1>
          </div>

          <div className="border-t border-border/80" />

          <div className="space-y-5 text-sm text-secondary">
            <PreviewRow label="Ref ID" value={data.link.tag} />
            <PreviewRow label="Link Type" value={linkTypeLabel} />
            <PreviewRow label="Expires In" value={expiryLabel} />
            <PreviewRow
              label="Creator"
              value="Hidden"
              icon={<EyeOff className="h-4 w-4 text-accent" />}
            />
            <PreviewRow
              label="Status"
              value={isExpired ? "Expired" : "Private"}
              icon={<Shield className="h-4 w-4 text-accent" />}
            />
          </div>

          {!data.link.amount && !isCreator && !isExpired ? (
            <label className="block space-y-2">
              <span className="text-sm text-secondary">Amount to send</span>
              <Input
                inputMode="decimal"
                placeholder={`Enter ${data.link.token} amount`}
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex items-center justify-center gap-5 pt-2">
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

          {!isCreator && !isExpired ? (
            <Button
              className="mt-4 h-16 w-full rounded-[22px] text-xl font-medium"
              disabled={!canPay || isPaying}
              onClick={handlePay}
            >
              {isPaying ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Sending payment
                </span>
              ) : (
                <>
                  Pay Now
                  <ArrowRight className="ml-3 h-5 w-5" />
                </>
              )}
            </Button>
          ) : null}

          {isCreator ? (
            <p className="text-center text-sm text-secondary">
              This is your PayLink. Share it instead of paying yourself.
            </p>
          ) : null}

          <p className="text-center text-sm text-secondary">Powered by Privii</p>
        </div>
      </div>
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
      className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      {children}
    </a>
  );
}

function formatExpiryCountdown(expiresAt: number | null) {
  if (!expiresAt) {
    return "Permanent";
  }

  const diff = expiresAt - Date.now();

  if (diff <= 0) {
    return "Expired";
  }

  const minutes = Math.floor(diff / (60 * 1000));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m left`;
  }

  return `${Math.max(remainingMinutes, 1)}m left`;
}

async function addUsdcTransfer({
  connection,
  transaction,
  sender,
  recipient,
  amount
}: {
  connection: Connection;
  transaction: Transaction;
  sender: PublicKey;
  recipient: PublicKey;
  amount: number;
}) {
  const senderAta = getAssociatedTokenAddressSync(USDC_MINT_ADDRESS, sender);
  const recipientAta = getAssociatedTokenAddressSync(USDC_MINT_ADDRESS, recipient);

  try {
    await getAccount(connection, recipientAta);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientAta,
        recipient,
        USDC_MINT_ADDRESS
      )
    );
  }

  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      USDC_MINT_ADDRESS,
      recipientAta,
      sender,
      Math.round(amount * 1_000_000),
      6,
      [],
      TOKEN_PROGRAM_ID
    )
  );
}
