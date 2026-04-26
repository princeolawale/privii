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
  amount?: string | null;
  token?: PayLinkToken;
  expiry?: PayLinkExpiryOption;
  type?: PayLinkType;
  creatorWallet?: string;
  recipientWallet?: string;
  paymentPurpose?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePayload;
    const creatorWallet = body.creatorWallet?.trim() || body.recipientWallet?.trim();

    if (!creatorWallet) {
      return NextResponse.json(
        { error: "Please connect your wallet first" },
        { status: 400 }
      );
    }

    try {
      new PublicKey(creatorWallet);
    } catch {
      return NextResponse.json(
        { error: "Creator wallet is not a valid Solana address." },
        { status: 400 }
      );
    }

    const ownerTagRecord = await getPriviiTagByOwner(creatorWallet);

    if (!ownerTagRecord) {
      return NextResponse.json(
        { error: "Create your payment tag first." },
        { status: 403 }
      );
    }

    const recipientWallet =
      ownerTagRecord.recipientWallet?.trim() || ownerTagRecord.ownerWallet?.trim() || null;

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

    let tag = generateRandomTag();
    let attempt = 0;

    while (((await tagExists(tag)) || (await priviiTagExists(tag))) && attempt < 5) {
      tag = generateRandomTag();
      attempt += 1;
    }

    if ((await tagExists(tag)) || (await priviiTagExists(tag))) {
      return NextResponse.json(
        { error: "Unable to create PayLink." },
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
      recipientWallet,
      createdAt: Date.now(),
      creatorWallet,
      creatorTag: ownerTagRecord.tag,
      paymentPurpose: body.paymentPurpose?.trim() || null,
      ownerTag: ownerTagRecord.tag,
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
