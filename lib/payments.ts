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

import { getEvmNetworkOption } from "@/lib/evm/chains";
import { verifyEvmTransaction } from "@/lib/evm/client";
import { USDC_MINT_ADDRESS, SOLANA_RPC_URL } from "@/lib/solana";
import type { EvmNetwork, PaymentAsset, PaymentNetwork, PaymentRecord, PaymentStatus } from "@/lib/types";

const paymentKey = (id: string) => `payment:${id}`;
const recipientIndexKey = (wallet: string) => `payment:recipient:${wallet}`;
const payerIndexKey = (wallet: string) => `payment:payer:${wallet}`;
const txSignatureIndexKey = (signature: string) => `payment:tx:${signature}`;
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export async function getPayment(id: string) {
  return kv.get<PaymentRecord>(paymentKey(id));
}

export async function savePayment(payment: PaymentRecord) {
  await kv.set(paymentKey(payment.id), payment);
  const existing = payment.recipient_wallet
    ? (await kv.get<string[]>(recipientIndexKey(payment.recipient_wallet))) ?? []
    : [];

  if (payment.recipient_wallet && !existing.includes(payment.id)) {
    await kv.set(recipientIndexKey(payment.recipient_wallet), [...existing, payment.id]);
  }

  if (payment.payer_wallet) {
    const payerExisting = (await kv.get<string[]>(payerIndexKey(payment.payer_wallet))) ?? [];

    if (!payerExisting.includes(payment.id)) {
      await kv.set(payerIndexKey(payment.payer_wallet), [...payerExisting, payment.id]);
    }
  }

  if (payment.tx_signature) {
    await kv.set(txSignatureIndexKey(payment.tx_signature), payment.id);
  }

  return payment;
}

export async function getPaymentBySignature(signature: string) {
  const paymentId = await kv.get<string>(txSignatureIndexKey(signature));

  if (!paymentId) {
    return null;
  }

  return getPayment(paymentId);
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

export async function getPaymentsByRecipient(wallet: string) {
  const ids = (await kv.get<string[]>(recipientIndexKey(wallet))) ?? [];
  const payments = await Promise.all(ids.map((id) => getPayment(id)));
  return payments
    .filter((payment): payment is PaymentRecord => Boolean(payment))
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function getPaymentsByPayer(wallet: string) {
  const ids = (await kv.get<string[]>(payerIndexKey(wallet))) ?? [];
  const payments = await Promise.all(ids.map((id) => getPayment(id)));
  return payments
    .filter((payment): payment is PaymentRecord => Boolean(payment))
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function getPaymentsByWallet(wallet: string) {
  const [received, sent] = await Promise.all([
    getPaymentsByRecipient(wallet),
    getPaymentsByPayer(wallet),
  ]);

  const deduped = new Map<string, PaymentRecord>();

  for (const payment of [...received, ...sent]) {
    deduped.set(payment.id, payment);
  }

  return Array.from(deduped.values()).sort((left, right) =>
    right.created_at.localeCompare(left.created_at)
  );
}

export function createPaymentRecord(input: {
  tag: string;
  receiverTag?: string | null;
  recipientWallet: string;
  asset: PaymentAsset;
  chain: PaymentNetwork;
  chainId?: number | null;
  expectedAmount: string;
  status?: PaymentStatus;
  payerWallet?: string | null;
  txSignature?: string | null;
  explorerUrl?: string | null;
}) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    tag: input.tag,
    recipient_wallet: input.recipientWallet,
    payer_wallet: input.payerWallet ?? null,
    receiver_tag: input.receiverTag ?? null,
    asset: input.asset,
    chain: input.chain,
    chain_id: input.chainId ?? null,
    amount: null,
    expected_amount: input.expectedAmount,
    tx_signature: input.txSignature ?? null,
    explorer_url: input.explorerUrl ?? null,
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

export async function confirmAndSavePayment(input: {
  tag: string;
  receiverTag?: string | null;
  recipientWallet: string;
  payerWallet: string;
  asset: PaymentAsset;
  chain: PaymentNetwork;
  expectedAmount: string;
  txSignature: string;
}) {
  const existing = await getPaymentBySignature(input.txSignature);

  if (existing) {
    return { status: existing.status, payment: existing } as const;
  }

  if (input.chain === "solana") {
    const status = await connection.getSignatureStatuses([input.txSignature], {
      searchTransactionHistory: true,
    });
    const signatureStatus = status.value[0];

    if (!signatureStatus) {
      return { status: "confirming" as const };
    }

    if (signatureStatus.err) {
      return { status: "failed" as const };
    }

    const transaction = await connection.getParsedTransaction(input.txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { status: "confirming" as const };
    }

    const pendingRecord = {
      ...createPaymentRecord({
        tag: input.tag,
        receiverTag: input.receiverTag,
        recipientWallet: input.recipientWallet,
        asset: input.asset,
        chain: "solana",
        expectedAmount: input.expectedAmount,
        status: "submitted",
        payerWallet: input.payerWallet,
        txSignature: input.txSignature,
        explorerUrl: `https://solscan.io/tx/${input.txSignature}`
      }),
    } satisfies PaymentRecord;

    const verified = verifyTransaction(transaction, pendingRecord);

    if (!verified.ok || !verified.amount) {
      return { status: "failed" as const };
    }

    const now = new Date().toISOString();
    const confirmedRecord: PaymentRecord = {
      ...pendingRecord,
      amount: verified.amount,
      status: "confirmed",
      updated_at: now,
      confirmed_at: now,
    };

    try {
      await savePayment(confirmedRecord);
    } catch (error) {
      console.error("payment history save error", error);
      return {
        status: "confirmed" as const,
        payment: confirmedRecord,
        historySaved: false,
      };
    }

    return {
      status: "confirmed" as const,
      payment: confirmedRecord,
      historySaved: true,
    };
  }

  const evmNetwork = input.chain as EvmNetwork;
  const networkOption = getEvmNetworkOption(evmNetwork);
  const verified = await verifyEvmTransaction({
    network: evmNetwork,
    asset: input.asset,
    recipientWallet: input.recipientWallet as `0x${string}`,
    payerWallet: input.payerWallet as `0x${string}`,
    txHash: input.txSignature as `0x${string}`,
    expectedAmount: input.expectedAmount,
  });

  if (!verified.ok || !verified.amount) {
    return { status: "failed" as const };
  }

  const now = new Date().toISOString();
  const confirmedRecord: PaymentRecord = {
    ...createPaymentRecord({
      tag: input.tag,
      receiverTag: input.receiverTag,
      recipientWallet: input.recipientWallet,
      asset: input.asset,
      chain: evmNetwork,
      chainId: networkOption.chain.id,
      expectedAmount: input.expectedAmount,
      status: "confirmed",
      payerWallet: input.payerWallet,
      txSignature: input.txSignature,
      explorerUrl: verified.explorerUrl
    }),
    amount: verified.amount,
    updated_at: now,
    confirmed_at: now,
  };

  try {
    await savePayment(confirmedRecord);
  } catch (error) {
    console.error("payment history save error", error);
    return {
      status: "confirmed" as const,
      payment: confirmedRecord,
      historySaved: false,
    };
  }

  return {
    status: "confirmed" as const,
    payment: confirmedRecord,
    historySaved: true,
  };
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

  if (payment.asset === "USDC") {
    return verifyUsdcTransfer(transaction, payment);
  }

  return { ok: false };
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
