import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { confirmAndSavePayment, parseDecimalAmount } from "@/lib/payments";
import { getPayLink } from "@/lib/paylinks";
import { getPriviiTag } from "@/lib/tags";
import type { PayLinkToken } from "@/lib/types";
import { isExpired, normalizePriviiTag } from "@/lib/utils";

type ConfirmPayload = {
  kind?: "tag" | "paylink";
  tag?: string;
  asset?: PayLinkToken;
  expectedAmount?: string;
  payerWallet?: string;
  txSignature?: string;
};

function resolveTagRecipientWallet(record: {
  recipientWallet?: string | null;
  ownerWallet?: string | null;
}) {
  return record.recipientWallet?.trim() || record.ownerWallet?.trim() || null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConfirmPayload;
    const kind = body.kind === "tag" ? "tag" : "paylink";
    const tag = normalizePriviiTag(body.tag ?? "");
    const payerWallet = body.payerWallet?.trim() ?? "";
    const txSignature = body.txSignature?.trim() ?? "";

    if (!tag || !payerWallet || !txSignature) {
      return NextResponse.json({ error: "Payment failed. Please try again" }, { status: 400 });
    }

    try {
      new PublicKey(payerWallet);
    } catch {
      return NextResponse.json({ error: "Please connect your wallet first" }, { status: 400 });
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

      if (
        !parseDecimalAmount(expectedAmount, asset === "SOL" ? 9 : 6) ||
        Number(expectedAmount) <= 0
      ) {
        return NextResponse.json({ error: "Enter an amount to continue" }, { status: 400 });
      }

      const result = await confirmAndSavePayment({
        tag: record.tag,
        recipientWallet,
        payerWallet,
        asset,
        expectedAmount,
        txSignature,
      });

      if (result.status === "failed") {
        return NextResponse.json({ error: "Payment failed. Please try again" }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    const link = await getPayLink(tag);

    if (!link) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    if (isExpired(link.expiresAt)) {
      return NextResponse.json({ error: "This payment link has expired" }, { status: 410 });
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
    const expectedAmount = link.amount?.trim() || body.expectedAmount?.trim() || "";

    if (
      !parseDecimalAmount(expectedAmount, asset === "SOL" ? 9 : 6) ||
      Number(expectedAmount) <= 0
    ) {
      return NextResponse.json({ error: "Enter an amount to continue" }, { status: 400 });
    }

    const result = await confirmAndSavePayment({
      tag: link.tag,
      recipientWallet,
      payerWallet,
      asset,
      expectedAmount,
      txSignature,
    });

    if (result.status === "failed") {
      return NextResponse.json({ error: "Payment failed. Please try again" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Payment failed. Please try again" },
      { status: 500 }
    );
  }
}
