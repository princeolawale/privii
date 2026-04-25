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

import { Button } from "@/components/ui/button";
import { USDC_MINT_ADDRESS } from "@/lib/solana";
import type { PayLinkResponse } from "@/lib/types";
import { formatAmount } from "@/lib/utils";

export function V2PayClient({ tag }: { tag: string }) {
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
        const response = await fetch(`/api/links/${tag}`, { cache: "no-store" });
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

  const enteredAmount = useMemo(
    () => data?.link.amount || customAmount,
    [customAmount, data?.link.amount]
  );

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
        paymentError instanceof Error ? paymentError.message : "Transaction failed."
      );
    } finally {
      setIsPaying(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-secondary">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        Loading v2 payment page
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
        <h1 className="mb-3 text-2xl font-semibold text-primary">Link unavailable</h1>
        <p className="text-secondary">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[34px] border border-white/10 bg-[#0A0B10] p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-accent">
            Privii v2
          </span>
          <span className="text-sm text-secondary">@{data.link.tag}</span>
        </div>

        <div className="mb-8 space-y-3">
          <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            {formatAmount(data.link.amount, data.link.token)}
          </h1>
          <p className="max-w-xl text-secondary">
            Same backend, alternate UI. The recipient wallet stays hidden from the public interface.
          </p>
        </div>

        {!data.link.amount ? (
          <div className="mb-5">
            <label className="mb-2 block text-sm text-secondary">Amount to send</label>
            <input
              inputMode="decimal"
              placeholder={`Enter ${data.link.token} amount`}
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              className="w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base text-primary outline-none transition placeholder:text-secondary/70 focus:border-accent focus:bg-white/[0.05]"
            />
          </div>
        ) : null}

        {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="h-14 flex-1 rounded-[20px] text-lg"
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
      </section>

      <section className="rounded-[34px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="mb-5 text-sm uppercase tracking-[0.24em] text-secondary">Details</p>
        <div className="space-y-4 text-sm text-secondary">
          <Info label="Status" value={isExpired ? "Expired" : "Active"} />
          <Info label="Type" value={data.link.type} />
          <Info label="Expiry" value={data.link.expiresAt ? new Date(data.link.expiresAt).toLocaleString() : "Never"} />
          <Info label="Wallet" value={wallet.connected ? "Connected" : "Not connected"} />
          <div className="rounded-[24px] border border-accent/20 bg-accent/10 p-4 text-primary">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              Hidden recipient wallet
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-white/8 bg-[#0A0B10] px-4 py-3">
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
