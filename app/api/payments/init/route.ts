import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { createPaymentRecord, parseDecimalAmount, savePayment } from "@/lib/payments";
import { getPayLink } from "@/lib/paylinks";
import { getPriviiTag } from "@/lib/tags";
import type { PayLinkToken } from "@/lib/types";
import { isExpired, normalizePriviiTag } from "@/lib/utils";

type PaymentInitPayload = {
  kind?: "tag" | "paylink";
  tag?: string;
  asset?: PayLinkToken;
  expectedAmount?: string;
};

function resolveTagRecipientWallet(record: {
  recipientWallet?: string | null;
  ownerWallet?: string | null;
}) {
  return record.recipientWallet?.trim() || record.ownerWallet?.trim() || null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PaymentInitPayload;
    const kind = body.kind === "tag" ? "tag" : "paylink";
    const tag = normalizePriviiTag(body.tag ?? "");

    if (!tag) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 400 });
    }

    if (kind === "tag") {
      const record = await getPriviiTag(tag);

      if (!record) {
        return NextResponse.json({ error: "Privii tag not found" }, { status: 404 });
      }

      const recipientWallet = resolveTagRecipientWallet(record);

      if (!recipientWallet) {
        return NextResponse.json(
          { error: "Recipient wallet not configured for this tag." },
          { status: 422 }
        );
      }

      try {
        new PublicKey(recipientWallet);
      } catch {
        return NextResponse.json(
          { error: "Recipient wallet not configured for this tag." },
          { status: 422 }
        );
      }

      const asset: PayLinkToken = body.asset === "SOL" ? "SOL" : "USDC";
      const expectedAmount = body.expectedAmount?.trim() ?? "";

      if (!parseDecimalAmount(expectedAmount, asset === "SOL" ? 9 : 6) || Number(expectedAmount) <= 0) {
        return NextResponse.json({ error: "Enter an amount to continue" }, { status: 400 });
      }

      const payment = createPaymentRecord({
        tag: record.tag,
        recipientWallet,
        asset,
        expectedAmount,
      });
      await savePayment(payment);

      return NextResponse.json({
        payment: {
          ...payment,
          kind: "tag" as const,
          recipientWallet,
          expiresAt: null,
          expired: false
        }
      });
    }

    const link = await getPayLink(tag);

    if (!link) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    const recipientWallet = link.recipientWallet?.trim() || null;

    if (!recipientWallet) {
      return NextResponse.json(
        { error: "Recipient wallet not configured for this tag." },
        { status: 422 }
      );
    }

    try {
      new PublicKey(recipientWallet);
    } catch {
      return NextResponse.json(
        { error: "Recipient wallet not configured for this tag." },
        { status: 422 }
      );
    }

    const asset: PayLinkToken = link.token === "SOL" ? "SOL" : "USDC";
    const expectedAmount = (link.amount?.trim() || body.expectedAmount?.trim() || "");

    if (!parseDecimalAmount(expectedAmount, asset === "SOL" ? 9 : 6) || Number(expectedAmount) <= 0) {
      return NextResponse.json({ error: "Enter an amount to continue" }, { status: 400 });
    }

    const payment = createPaymentRecord({
      tag: link.tag,
      recipientWallet,
      asset,
      expectedAmount,
      status: isExpired(link.expiresAt) ? "expired" : "initialized",
    });
    await savePayment(payment);

    return NextResponse.json({
      payment: {
        ...payment,
        kind: "paylink" as const,
        recipientWallet,
        token: link.token,
        amount: link.amount,
        expiresAt: link.expiresAt,
        expired: isExpired(link.expiresAt)
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Payment failed. Please try again" },
      { status: 500 }
    );
  }
}
