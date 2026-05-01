import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { getPaymentsByWallet } from "@/lib/payments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const normalizedWallet = decodeURIComponent(wallet).trim();

  const isSolanaAddress = (() => {
    try {
      new PublicKey(normalizedWallet);
      return true;
    } catch {
      return false;
    }
  })();

  if (!isSolanaAddress && !isAddress(normalizedWallet)) {
    return NextResponse.json(
      { error: "Wallet is not a valid address." },
      { status: 400 }
    );
  }

  const payments = await getPaymentsByWallet(normalizedWallet);
  const matchesWallet = (value: string | null) =>
    Boolean(value) &&
    (isAddress(normalizedWallet) && value
      ? value.toLowerCase() === normalizedWallet.toLowerCase()
      : value === normalizedWallet);
  const visiblePayments = payments.filter((payment) => {
    const isSent = matchesWallet(payment.payer_wallet);
    const isReceived = matchesWallet(payment.recipient_wallet);

    if (isSent) {
      return Boolean(payment.tx_signature) && payment.status === "confirmed";
    }

    if (isReceived) {
      return Boolean(payment.tx_signature) && payment.status === "confirmed";
    }

    return false;
  });

  return NextResponse.json({
    payments: visiblePayments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      asset: payment.asset,
      status: payment.status,
      tx_signature: payment.tx_signature,
      chain: payment.chain,
      explorer_url: payment.explorer_url,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      confirmed_at: payment.confirmed_at,
      payer_wallet: payment.payer_wallet,
      recipient_wallet: payment.recipient_wallet,
      direction: matchesWallet(payment.payer_wallet) ? "sent" : "received",
    })),
  });
}
