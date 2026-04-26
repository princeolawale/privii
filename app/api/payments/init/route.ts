import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getPayLink } from "@/lib/paylinks";
import { getPriviiTag } from "@/lib/tags";
import { isExpired, normalizePriviiTag } from "@/lib/utils";

type PaymentInitPayload = {
  kind?: "tag" | "paylink";
  tag?: string;
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

      return NextResponse.json({
        payment: {
          kind: "tag" as const,
          tag: record.tag,
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

    return NextResponse.json({
      payment: {
        kind: "paylink" as const,
        tag: link.tag,
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
