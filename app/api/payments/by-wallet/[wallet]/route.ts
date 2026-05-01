import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getPaymentsByWallet } from "@/lib/payments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const normalizedWallet = decodeURIComponent(wallet).trim();

  try {
    new PublicKey(normalizedWallet);
  } catch {
    return NextResponse.json(
      { error: "Wallet is not a valid Solana address." },
      { status: 400 }
    );
  }

  const payments = await getPaymentsByWallet(normalizedWallet);
  const visiblePayments = payments.filter((payment) => {
    const isSent = payment.payer_wallet === normalizedWallet;
    const isReceived = payment.recipient_wallet === normalizedWallet;

    if (isSent || isReceived) {
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
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      confirmed_at: payment.confirmed_at,
      payer_wallet: payment.payer_wallet,
      recipient_wallet: payment.recipient_wallet,
      direction: payment.payer_wallet === normalizedWallet ? "sent" : "received",
    })),
  });
}
