"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  LoaderCircle,
  Send,
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
import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { USDC_MINT_ADDRESS } from "@/lib/solana";
import type { PayLinkResponse, PayLinkToken, PriviiTagRecord } from "@/lib/types";
import { buildWhatsAppShareUrl, buildXShareUrl } from "@/lib/utils";

type Props = {
  tag: string;
  kind?: "paylink" | "tag";
};

type PayTarget =
  | { kind: "paylink"; link: PayLinkResponse["link"]; status: PayLinkResponse["status"] }
  | { kind: "tag"; tagRecord: PriviiTagRecord };

export function PayLinkPaymentClient({ tag, kind = "paylink" }: Props) {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [data, setData] = useState<PayTarget | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<PayLinkToken>("USDC");
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
        const response = await fetch(kind === "tag" ? `/api/tags/${tag}` : `/api/links/${tag}`, {
          cache: "no-store"
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load PayLink.");
        }

        if (!cancelled) {
          if (kind === "tag") {
            setData({ kind: "tag", tagRecord: result.tag });
          } else {
            setData({ kind: "paylink", link: result.link, status: result.status });
          }
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : kind === "tag"
                ? "Unable to load tag."
                : "Unable to load link."
          );
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
  }, [kind, tag]);

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : `/${tag}`;

  const enteredAmount = useMemo(() => {
    if (data?.kind === "paylink" && data.link.amount) {
      return data.link.amount;
    }

    return customAmount;
  }, [customAmount, data]);

  const isExpired = data?.kind === "paylink" ? data.status === "expired" : false;
  const recipientWallet =
    data?.kind === "paylink" ? data.link.recipientWallet : data?.kind === "tag" ? data.tagRecord.ownerWallet : null;
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

  async function handleShare() {
    if (!data) {
      return;
    }

    if (navigator.share) {
      try {
        const shareTag = data.kind === "tag" ? data.tagRecord.tag : data.link.tag;
        await navigator.share({
          title: "Privii PayLink",
          text: `Pay me privately with my Privii link (@${shareTag})`,
          url: currentUrl
        });
        return;
      } catch {
        // Fall back to copy when native share is dismissed or unavailable.
      }
    }

    await handleCopy();
  }

  async function handlePay() {
    if (!data || !wallet.publicKey || !wallet.sendTransaction) {
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
      const recipient = new PublicKey(
        data.kind === "tag" ? data.tagRecord.ownerWallet : data.link.recipientWallet
      );
      const transaction = new Transaction();
      const paymentToken = data.kind === "tag" ? selectedToken : data.link.token;

      if (paymentToken === "SOL") {
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
          data.kind === "tag" ? data.tagRecord.tag : data.link.tag
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
          {kind === "tag" ? "Loading Privii tag" : "Loading PayLink"}
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold">
          {kind === "tag" ? "Privii tag not found." : "Link unavailable"}
        </h1>
        <p className="text-sm text-secondary">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const shareTag = data.kind === "tag" ? data.tagRecord.tag : data.link.tag;
  const paymentToken = data.kind === "tag" ? selectedToken : data.link.token;
  const whatsappUrl = buildWhatsAppShareUrl(currentUrl, shareTag);
  const xUrl = buildXShareUrl(currentUrl, shareTag);
  const amountLabel =
    data.kind === "paylink"
      ? data.link.amount
        ? `${data.link.amount} ${data.link.token}`
        : "Custom amount"
      : "Custom amount";
  const linkTypeLabel =
    data.kind === "tag"
      ? "Privii tag"
      : data.link.type === "permanent"
        ? "Permalink"
        : "Expiring link";
  const expiryLabel =
    data.kind === "tag"
      ? "No expiry"
      : data.link.type === "permanent"
        ? "No expiry"
        : formatExpiryLabel(data.link.expiresAt);
  const shouldShowCustomAmount =
    !isCreator && !isExpired && (data.kind === "tag" || !data.link.amount);

  return (
    <div className="mx-auto w-full max-w-xl pt-12 sm:pt-16">
      <div className="relative rounded-[34px] border border-border bg-card/95 px-6 pb-8 pt-24 shadow-[0_30px_120px_rgba(0,0,0,0.5)] sm:px-8 sm:pb-10 sm:pt-28">
        <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <TokenBadge token={paymentToken} />
          <span className="mt-3 inline-flex items-center rounded-full bg-[#22C55E] px-4 py-1 text-xs font-semibold tracking-[0.18em] text-black">
            ACTIVE
          </span>
        </div>

          <div className="space-y-9">
          <div className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-secondary">
              {data.kind === "tag" ? "Privii tag" : "Payment Request"}
            </p>
            {data.kind === "tag" ? (
              <>
                <h1 className="text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
                  Send crypto
                </h1>
                <p className="text-base text-secondary sm:text-lg">to @{data.tagRecord.tag}</p>
              </>
            ) : (
              <h1 className="text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
                {data.link.amount ? data.link.amount : "Custom"}{" "}
                <span className="text-4xl font-medium text-primary/90 sm:text-5xl">
                  {data.link.amount ? data.link.token : "amount"}
                </span>
              </h1>
            )}
          </div>

          <div className="border-t border-border/80" />

          <div className="space-y-6 text-sm text-secondary">
            <PreviewRow
              label={data.kind === "tag" ? "Tag" : "Ref ID"}
              value={data.kind === "tag" ? `@${data.tagRecord.tag}` : data.link.ownerTag ? `@${data.link.ownerTag}` : data.link.tag}
            />
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
              value={isExpired ? "Expired" : "Private"}
              icon={<Shield className="h-4 w-4 text-accent" />}
            />
          </div>

          {shouldShowCustomAmount ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-secondary">Amount to send</span>
                <Input
                  inputMode="decimal"
                  placeholder={`Enter ${paymentToken} amount`}
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                />
              </label>

              {data.kind === "tag" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-secondary">Token</span>
                  <Select
                    value={selectedToken}
                    onChange={(event) => setSelectedToken(event.target.value as PayLinkToken)}
                  >
                    <option value="USDC">USDC</option>
                    <option value="SOL">SOL</option>
                  </Select>
                </label>
              ) : null}
            </div>
          ) : null}

          {!wallet.connected && !isCreator && !isExpired ? (
            <div className="space-y-3">
              <p className="text-sm text-secondary">Connect wallet to continue.</p>
              <ConnectWalletButton className="!w-full" />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

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

          {isCreator ? (
            <Button
              className="mt-8 w-full"
              onClick={handleShare}
            >
              Share PayLink
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          ) : null}

          {!isCreator && !isExpired ? (
            <Button
              className="mt-8 w-full"
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

  return remainingMinutes <= 5 ? "Expires soon" : `Expires in ${Math.max(remainingMinutes, 1)}m`;
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
