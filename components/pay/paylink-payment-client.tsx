"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LoaderCircle, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { USDC_MINT_ADDRESS } from "@/lib/solana";
import type { PayLinkResponse } from "@/lib/types";
import { formatAmount } from "@/lib/utils";

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

  const enteredAmount = useMemo(() => {
    if (data?.link.amount) {
      return data.link.amount;
    }

    return customAmount;
  }, [customAmount, data?.link.amount]);

  const isExpired = data?.status === "expired";
  const canPay =
    wallet.connected &&
    wallet.publicKey &&
    !isExpired &&
    Boolean(enteredAmount) &&
    Number(enteredAmount) > 0;

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

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <div className="inline-flex w-fit rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent">
            PayLink
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Send {formatAmount(data.link.amount, data.link.token)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-secondary">
              Complete the payment with any supported Solana wallet. The recipient
              address is used behind the scenes and stays hidden from the public UI.
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-border bg-background/70 p-5 sm:grid-cols-3">
          <Metric label="User tag" value={`@${data.link.tag}`} />
          <Metric label="Token" value={data.link.token} />
          <Metric label="Status" value={isExpired ? "Expired" : "Active"} />
        </div>

        {!data.link.amount ? (
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <ConnectWalletButton />
          <Button
            className="sm:min-w-[180px]"
            disabled={!canPay || isPaying}
            onClick={handlePay}
          >
            {isPaying ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Sending payment
              </span>
            ) : (
              `Pay ${data.link.token}`
            )}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <p className="text-sm text-secondary">Privii summary</p>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {formatAmount(data.link.amount, data.link.token)}
          </p>
        </div>

        <div className="space-y-3 text-sm text-secondary">
          <SummaryRow label="Link type" value={data.link.type} />
          <SummaryRow
            label="Expiry"
            value={data.link.expiresAt ? new Date(data.link.expiresAt).toLocaleString() : "Never"}
          />
          <SummaryRow
            label="Wallet status"
            value={wallet.connected ? "Connected" : "Not connected"}
          />
          <SummaryRow label="Creator" value="Hidden" />
        </div>

        {isExpired ? (
          <div className="rounded-2xl border border-border bg-background/80 p-4 text-sm text-secondary">
            This PayLink has expired and can no longer receive payments.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background/80 p-4 text-sm text-secondary">
            <span className="flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4 text-accent" />
              Private recipient details
            </span>
            <p className="mt-2">
              Funds are sent directly on-chain from the payer wallet to the recipient wallet.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{label}</p>
      <p className="mt-2 text-sm font-medium text-primary">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span>{label}</span>
      <span className="text-right text-primary">{value}</span>
    </div>
  );
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
