import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getPayment, updatePayment } from "@/lib/payments";

type SubmitPayload = {
  txSignature?: string;
  payerWallet?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await getPayment(id);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const body = (await request.json()) as SubmitPayload;
    const txSignature = body.txSignature?.trim();
    const payerWallet = body.payerWallet?.trim();

    if (!txSignature || !payerWallet) {
      return NextResponse.json(
        { error: "Payment failed. Please try again" },
        { status: 400 }
      );
    }

    try {
      new PublicKey(payerWallet);
    } catch {
      return NextResponse.json(
        { error: "Payment failed. Please try again" },
        { status: 400 }
      );
    }

    const updated = await updatePayment(id, {
      tx_signature: txSignature,
      payer_wallet: payerWallet,
      status: payment.status === "expired" ? "expired" : "submitted",
    });

    return NextResponse.json({ payment: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Payment failed. Please try again" },
      { status: 500 }
    );
  }
}
