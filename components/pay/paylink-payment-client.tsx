"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  Check,
  Copy,
  LoaderCircle,
  ExternalLink,
  Send
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
  const [now, setNow] = useState(Date.now());

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
          throw new Error(
            result.error || (kind === "tag" ? "Privii tag not found" : "Payment link not found")
          );
        }

        if (!cancelled) {
          if (kind === "tag") {
            setData({ kind: "tag", tagRecord: result.tag });
          } else {
            setData({ kind: "paylink", link: result.link, status: result.status });
          }
        }
      } catch (fetchError) {
        console.error(fetchError);
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : kind === "tag"
                ? "Privii tag not found"
                : "Payment link not found"
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

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : `/${tag}`;

  const enteredAmount = useMemo(() => {
    if (data?.kind === "paylink" && data.link.amount) {
      return data.link.amount;
    }

    return customAmount;
  }, [customAmount, data]);

  const isExpired =
    data?.kind === "paylink"
      ? data.status === "expired" || (data.link.expiresAt ? data.link.expiresAt <= now : false)
      : false;
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
    if (!data) {
      return;
    }

    if (!wallet.connected || !wallet.publicKey || !wallet.sendTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    const amountNumber = Number(enteredAmount);

    if (!enteredAmount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError("Enter an amount to continue");
      return;
    }

    setError(null);
    setIsPaying(true);

    const paymentToken = data.kind === "tag" ? selectedToken : data.link.token;

    try {
      const recipient = new PublicKey(
        data.kind === "tag" ? data.tagRecord.ownerWallet : data.link.recipientWallet
      );
      const transaction = new Transaction();

      if (paymentToken === "SOL") {
        const balanceLamports = await connection.getBalance(wallet.publicKey, "confirmed");
        const requiredLamports = Math.round(amountNumber * 1e9);

        if (balanceLamports < requiredLamports) {
          throw new Error("Insufficient wallet balance");
        }

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: recipient,
            lamports: requiredLamports
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

      const blockhash = await fetchLatestBlockhashWithRetry(connection);
      transaction.recentBlockhash = blockhash.blockhash;
      transaction.feePayer = wallet.publicKey;

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(
        {
          signature,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight
        },
        "confirmed"
      );

      router.push(
        `/success?tx=${encodeURIComponent(signature)}&tag=${encodeURIComponent(
          data.kind === "tag" ? data.tagRecord.tag : data.link.tag
        )}`
      );
    } catch (paymentError) {
      if (paymentToken === "SOL") {
        console.error("SOL transfer error:", paymentError);
      }
      console.error(paymentError);
      setError(
        paymentError instanceof Error
          ? getReadablePaymentError(paymentError.message)
          : "Payment failed. Please try again"
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
          {kind === "tag" ? "Privii tag not found" : "Payment link not found"}
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
  const expiryLabel =
    data.kind === "tag"
      ? "No expiry"
      : data.link.type === "permanent"
        ? "No expiry"
        : formatExpiryLabel(data.link.expiresAt, now);
  const shouldShowCustomAmount =
    !isCreator && !isExpired && (data.kind === "tag" || !data.link.amount);
  const title =
    data.kind === "tag"
      ? `Pay @${data.tagRecord.tag}`
      : data.link.amount
        ? `Pay ${data.link.amount} ${data.link.token}`
        : "Send payment";
  const subtitle =
    data.kind === "tag"
      ? "Choose an amount and complete the payment."
      : data.link.amount
        ? "Complete this payment with your connected wallet."
        : "Enter an amount and complete the payment.";

  return (
    <div className="mx-auto w-full max-w-xl pt-16 sm:pt-20">
      <div className="relative rounded-[34px] border border-border bg-card/95 px-6 pb-8 pt-24 shadow-[0_30px_120px_rgba(0,0,0,0.5)] sm:px-8 sm:pb-10 sm:pt-28">
        <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <TokenBadge token={paymentToken} />
        </div>

        <div className="space-y-8">
          <div className="flex justify-center">
            <ExpiryPill expired={isExpired} label={isExpired ? "Expired" : expiryLabel} />
          </div>

          <div className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-secondary">
              {data.kind === "tag" ? "Privii tag" : "Payment Request"}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto max-w-md text-sm leading-6 text-secondary sm:text-base">
              {subtitle}
            </p>
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
              ) : (
                <label className="block space-y-2">
                  <span className="text-sm text-secondary">Token</span>
                  <Select value={data.link.token} disabled onChange={() => undefined}>
                    <option value={data.link.token}>{data.link.token}</option>
                  </Select>
                </label>
              )}
            </div>
          ) : data.kind === "paylink" && data.link.amount ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-secondary">Amount to send</span>
                <Input value={data.link.amount} disabled />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-secondary">Token</span>
                <Select value={data.link.token} disabled onChange={() => undefined}>
                  <option value={data.link.token}>{data.link.token}</option>
                </Select>
              </label>
            </div>
          ) : null}

          {!wallet.connected && !isCreator && !isExpired ? (
            <div className="space-y-3">
              <p className="text-sm text-secondary">Please connect your wallet first</p>
              <ConnectWalletButton className="!w-full" />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {isExpired ? (
            <p className="text-sm text-red-400">This payment link has expired</p>
          ) : null}

          {isCreator ? (
            <>
              <div className="flex items-center justify-center gap-4 pt-2">
                <IconActionButton
                  label={copied ? "Copied" : "Copy"}
                  icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  onClick={handleCopy}
                />
                <IconActionLink
                  href={buildXShareUrl(currentUrl, shareTag)}
                  label="Share on X"
                  icon={<span className="text-sm font-medium">X</span>}
                />
                <IconActionLink
                  href={buildWhatsAppShareUrl(currentUrl, shareTag)}
                  label="Share on WhatsApp"
                  icon={<Send className="h-4 w-4" />}
                />
                <IconActionLink
                  href={currentUrl}
                  label="Open payment page"
                  icon={<ExternalLink className="h-4 w-4" />}
                />
              </div>

              <Button className="w-full" onClick={handleShare}>
                Share PayLink
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </>
          ) : null}

          {!isCreator && !isExpired ? (
            <Button className="w-full" disabled={!canPay || isPaying} onClick={handlePay}>
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
        </div>
      </div>
    </div>
  );
}

function TokenBadge({ token }: { token: PayLinkToken }) {
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-[#171717] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl font-semibold text-white">
        {token === "USDC" ? "$" : "S"}
      </div>
    </div>
  );
}

function IconActionButton({
  icon,
  label,
  onClick
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function IconActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      {icon}
    </a>
  );
}

function ExpiryPill({ label, expired }: { label: string; expired?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        expired
          ? "border-white/10 bg-white/[0.03] text-secondary"
          : "border-accent/20 bg-accent/10 text-accent"
      }`}
    >
      {expired ? "This payment link has expired" : label}
    </span>
  );
}

function formatExpiryLabel(expiresAt: number | null, now: number) {
  if (!expiresAt) {
    return "No expiry";
  }

  const diff = expiresAt - now;

  if (diff <= 0) {
    return "Expires soon";
  }

  const totalSeconds = Math.max(Math.floor(diff / 1000), 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `Expires in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Expires in ${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `Expires in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
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
  let senderAccount;

  try {
    senderAccount = await getAccount(connection, senderAta);
  } catch {
    throw new Error("USDC wallet not initialized");
  }

  const requiredAmount = BigInt(Math.round(amount * 1_000_000));
  const solBalanceLamports = await connection.getBalance(sender, "confirmed");

  if (solBalanceLamports < Math.round(0.002 * LAMPORTS_PER_SOL)) {
    throw new Error("Insufficient SOL for transaction fees");
  }

  if (senderAccount.amount < requiredAmount) {
    throw new Error("Insufficient USDC balance");
  }

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
      Number(requiredAmount),
      6,
      [],
      TOKEN_PROGRAM_ID
    )
  );
}

async function fetchLatestBlockhashWithRetry(connection: Connection) {
  try {
    return await connection.getLatestBlockhash("confirmed");
  } catch (error) {
    console.error("Blockhash fetch error:", error);
    return connection.getLatestBlockhash("confirmed");
  }
}

function getReadablePaymentError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("usdc wallet not initialized")) {
    return "USDC wallet not initialized";
  }

  if (normalized.includes("insufficient usdc")) {
    return "Insufficient USDC balance";
  }

  if (normalized.includes("insufficient sol")) {
    return "Insufficient SOL for transaction fees";
  }

  if (
    normalized.includes("insufficient") ||
    normalized.includes("no record of a prior credit") ||
    normalized.includes("attempt to debit")
  ) {
    return "Insufficient wallet balance";
  }

  if (normalized.includes("user rejected") || normalized.includes("cancelled")) {
    return "Payment failed. Please try again";
  }

  return "Payment failed. Please try again";
}
