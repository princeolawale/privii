import { NextResponse } from "next/server";

import { confirmPaymentRecord, getPayment } from "@/lib/payments";

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

    if (payment.status === "confirmed" || payment.status === "failed" || payment.status === "expired") {
      return NextResponse.json({ payment });
    }

    const updated = await confirmPaymentRecord(payment);

    return NextResponse.json({ payment: updated ?? payment });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Payment failed. Please try again" },
      { status: 500 }
    );
  }
}
