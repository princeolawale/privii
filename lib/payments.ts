import { kv } from "@vercel/kv";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import { USDC_MINT_ADDRESS, SOLANA_RPC_URL } from "@/lib/solana";
import type { PaymentRecord, PaymentStatus, PayLinkToken } from "@/lib/types";

const paymentKey = (id: string) => `payment:${id}`;
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export async function getPayment(id: string) {
  return kv.get<PaymentRecord>(paymentKey(id));
}

export async function savePayment(payment: PaymentRecord) {
  await kv.set(paymentKey(payment.id), payment);
  return payment;
}

export async function updatePayment(
  id: string,
  updates: Partial<PaymentRecord> & Pick<PaymentRecord, "status">
) {
  const existing = await getPayment(id);

  if (!existing) {
    return null;
  }

  const next: PaymentRecord = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await savePayment(next);
  return next;
}

export function createPaymentRecord(input: {
  tag: string;
  recipientWallet: string;
  asset: PayLinkToken;
  expectedAmount: string;
  status?: PaymentStatus;
}) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    tag: input.tag,
    recipient_wallet: input.recipientWallet,
    payer_wallet: null,
    asset: input.asset,
    amount: null,
    expected_amount: input.expectedAmount,
    tx_signature: null,
    status: input.status ?? "initialized",
    created_at: now,
    updated_at: now,
    confirmed_at: null,
  } satisfies PaymentRecord;
}

export function parseDecimalAmount(value: string, decimals: number) {
  const normalized = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");

  if (fraction.length > decimals) {
    return null;
  }

  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(`${whole}${paddedFraction}`.replace(/^0+(?=\d)/, "") || "0");
}

export async function confirmPaymentRecord(payment: PaymentRecord) {
  if (!payment.tx_signature) {
    return updatePayment(payment.id, { status: "failed" });
  }

  const status = await connection.getSignatureStatuses([payment.tx_signature], {
    searchTransactionHistory: true,
  });
  const signatureStatus = status.value[0];

  if (!signatureStatus) {
    return payment;
  }

  if (signatureStatus.err) {
    return updatePayment(payment.id, { status: "failed" });
  }

  const transaction = await connection.getParsedTransaction(payment.tx_signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!transaction) {
    return payment;
  }

  const verified = verifyTransaction(transaction, payment);

  if (!verified.ok) {
    return updatePayment(payment.id, {
      status: "failed",
      amount: verified.amount ?? null,
    });
  }

  return updatePayment(payment.id, {
    status: "confirmed",
    amount: verified.amount,
    confirmed_at: new Date().toISOString(),
  });
}

function verifyTransaction(
  transaction: ParsedTransactionWithMeta,
  payment: PaymentRecord
): { ok: boolean; amount?: string } {
  if (transaction.meta?.err) {
    return { ok: false };
  }

  if (payment.asset === "SOL") {
    return verifySolTransfer(transaction, payment);
  }

  return verifyUsdcTransfer(transaction, payment);
}

function verifySolTransfer(transaction: ParsedTransactionWithMeta, payment: PaymentRecord) {
  const expectedLamports = parseDecimalAmount(payment.expected_amount, 9);

  if (!expectedLamports) {
    return { ok: false };
  }

  for (const instruction of transaction.transaction.message.instructions) {
    if (!("parsed" in instruction)) {
      continue;
    }

    const parsedInstruction = instruction as ParsedInstruction;

    if (
      parsedInstruction.program !== "system" ||
      parsedInstruction.parsed?.type !== "transfer"
    ) {
      continue;
    }

    const info = parsedInstruction.parsed.info as {
      source?: string;
      destination?: string;
      lamports?: number;
    };

    const lamports = BigInt(info.lamports ?? 0);

    if (
      info.source === payment.payer_wallet &&
      info.destination === payment.recipient_wallet &&
      lamports >= expectedLamports
    ) {
      return {
        ok: true,
        amount: formatAtomicAmount(lamports, 9),
      };
    }
  }

  return { ok: false };
}

function verifyUsdcTransfer(transaction: ParsedTransactionWithMeta, payment: PaymentRecord) {
  if (!payment.payer_wallet) {
    return { ok: false };
  }

  const expectedAmount = parseDecimalAmount(payment.expected_amount, 6);

  if (!expectedAmount) {
    return { ok: false };
  }

  const recipientAta = getAssociatedTokenAddressSync(
    USDC_MINT_ADDRESS,
    new PublicKey(payment.recipient_wallet)
  ).toBase58();
  const payerAta = getAssociatedTokenAddressSync(
    USDC_MINT_ADDRESS,
    new PublicKey(payment.payer_wallet)
  ).toBase58();

  for (const instruction of transaction.transaction.message.instructions) {
    if (!("parsed" in instruction)) {
      continue;
    }

    const parsedInstruction = instruction as ParsedInstruction;

    if (
      parsedInstruction.program !== "spl-token" ||
      !["transferChecked", "transfer"].includes(parsedInstruction.parsed?.type)
    ) {
      continue;
    }

    const info = parsedInstruction.parsed.info as {
      authority?: string;
      source?: string;
      destination?: string;
      mint?: string;
      amount?: string;
      tokenAmount?: {
        amount?: string;
      };
    };

    const amount = BigInt(info.tokenAmount?.amount ?? info.amount ?? "0");

    if (
      info.authority === payment.payer_wallet &&
      info.source === payerAta &&
      info.destination === recipientAta &&
      info.mint === USDC_MINT_ADDRESS.toBase58() &&
      amount >= expectedAmount
    ) {
      return {
        ok: true,
        amount: formatAtomicAmount(amount, 6),
      };
    }
  }

  return { ok: false };
}

function formatAtomicAmount(amount: bigint, decimals: number) {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  return `${whole.toString()}.${fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")}`;
}

export function minimumSolFeeLamports() {
  return Math.round(0.002 * LAMPORTS_PER_SOL);
}
