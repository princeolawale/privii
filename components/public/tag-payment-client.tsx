"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, EyeOff, LoaderCircle, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
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
import { Select } from "@/components/ui/select";
import { USDC_MINT_ADDRESS } from "@/lib/solana";
import type { PayLinkToken, PriviiTagRecord } from "@/lib/types";

export function TagPaymentClient({ record }: { record: PriviiTagRecord }) {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<PayLinkToken>("USDC");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPay = useMemo(() => {
    const numericAmount = Number(amount);

    return (
      wallet.connected &&
      wallet.publicKey &&
      Number.isFinite(numericAmount) &&
      numericAmount > 0
    );
  }, [amount, wallet.connected, wallet.publicKey]);

  async function handlePay() {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount before sending crypto.");
      return;
    }

    setError(null);
    setIsPaying(true);

    try {
      const recipient = new PublicKey(record.ownerWallet);
      const transaction = new Transaction();

      if (token === "SOL") {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: recipient,
            lamports: Math.round(numericAmount * LAMPORTS_PER_SOL)
          })
        );
      } else {
        await addUsdcTransfer({
          connection,
          transaction,
          sender: wallet.publicKey,
          recipient,
          amount: numericAmount
        });
      }

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");
      router.push(
        `/success?tx=${encodeURIComponent(signature)}&tag=${encodeURIComponent(record.tag)}`
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

  return (
    <div className="mx-auto w-full max-w-xl pt-12 sm:pt-16">
      <Card className="space-y-8 rounded-[34px] px-6 py-8 sm:px-8 sm:py-10">
        <div className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-secondary">Privii tag</p>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">@{record.tag}</h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-secondary sm:text-base">
            Send crypto privately. The wallet stays hidden in the UI, and private
            receive addresses are coming soon.
          </p>
        </div>

        <div className="rounded-[28px] border border-border bg-background/60 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-secondary">Custom amount</span>
              <Input
                inputMode="decimal"
                placeholder="25"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

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
          </div>
        </div>

        <div className="space-y-6 text-sm text-secondary">
          <ProfileRow label="Status" value="Active" />
          <ProfileRow label="Link type" value="Privii tag" />
          <ProfileRow
            label="Creator"
            value="Hidden"
            icon={<EyeOff className="h-4 w-4 text-accent" />}
          />
          <ProfileRow
            label="Receive"
            value="Wallet hidden in the UI"
            icon={<Shield className="h-4 w-4 text-accent" />}
          />
        </div>

        {!wallet.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-secondary">Connect wallet to send crypto.</p>
            <ConnectWalletButton className="!w-full" />
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button className="w-full" disabled={!canPay || isPaying} onClick={handlePay}>
          {isPaying ? (
            <span className="flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Sending crypto
            </span>
          ) : (
            <>
              Pay Now
              <ArrowRight className="ml-3 h-5 w-5" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-secondary">Powered by Privii</p>
      </Card>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="flex items-center gap-2 text-right text-primary">
        {icon}
        {value}
      </span>
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
