import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { savePayLink, tagExists } from "@/lib/paylinks";
import { getPriviiTagByOwner, priviiTagExists } from "@/lib/tags";
import type {
  PayLinkExpiryOption,
  PayLinkRecord,
  PayLinkToken,
  PayLinkType
} from "@/lib/types";
import { buildPaymentUrl, expiryToTimestamp, generateRandomTag } from "@/lib/utils";

type CreatePayload = {
  tag?: string;
  slug?: string;
  amount?: string | null;
  token?: PayLinkToken;
  expiry?: PayLinkExpiryOption;
  type?: PayLinkType;
  recipientWallet?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePayload;
    const requestedTag = body.tag?.trim().toLowerCase() || body.slug?.trim().toLowerCase();
    const tag = requestedTag || generateRandomTag();

    if (!/^[a-z0-9-]{3,32}$/.test(tag)) {
      return NextResponse.json(
        {
          error: "Use lowercase letters, numbers, or hyphens only"
        },
        { status: 400 }
      );
    }

    if (!body.recipientWallet) {
      return NextResponse.json(
        { error: "Recipient wallet is required." },
        { status: 400 }
      );
    }

    try {
      new PublicKey(body.recipientWallet);
    } catch {
      return NextResponse.json(
        { error: "Recipient wallet is not a valid Solana address." },
        { status: 400 }
      );
    }

    if ((await tagExists(tag)) || (await priviiTagExists(tag))) {
      return NextResponse.json(
        { error: "This Privii tag is already taken" },
        { status: 409 }
      );
    }

    if (body.amount !== null && body.amount !== undefined && body.amount !== "") {
      const amount = Number(body.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { error: "Amount must be a positive number." },
          { status: 400 }
        );
      }
    }

    const type: PayLinkType = body.type === "expiring" ? "expiring" : "permanent";
    const expiryOption: PayLinkExpiryOption =
      type === "expiring" ? body.expiry || "24h" : "none";
    const expiresAt = expiryToTimestamp(expiryOption);

    const link: PayLinkRecord = {
      tag,
      amount: body.amount?.toString() || null,
      token: body.token === "SOL" ? "SOL" : "USDC",
      type,
      expiryOption,
      expiresAt,
      recipientWallet: body.recipientWallet,
      createdAt: Date.now(),
      ownerTag: (await getPriviiTagByOwner(body.recipientWallet))?.tag ?? null,
      stealthEnabled: false,
      stealthMode: "coming_soon"
    };

    await savePayLink(link);

    return NextResponse.json({
      link,
      url: buildPaymentUrl(link.tag)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create PayLink."
      },
      { status: 500 }
    );
  }
}
