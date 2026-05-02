import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getPaymentsByRecipient, isConfirmedHistoryPayment } from "@/lib/payments";

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

  const payments = await getPaymentsByRecipient(normalizedWallet);
  const visiblePayments = payments.filter(isConfirmedHistoryPayment);

  return NextResponse.json({
    payments: visiblePayments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      asset: payment.asset,
      status: payment.status,
      tx_signature: payment.tx_signature,
      created_at: payment.created_at,
      payer_wallet: payment.payer_wallet,
    })),
  });
}
