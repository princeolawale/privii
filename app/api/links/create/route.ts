import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { savePayLink, tagExists } from "@/lib/paylinks";
import {
  getPriviiTagByOwner,
  priviiTagExists,
  hasTagEvmWallet,
  hasTagSolanaWallet,
  resolveTagEvmWallet,
  resolveTagSolanaWallet
} from "@/lib/tags";
import type {
  PayLinkExpiryOption,
  PaymentAsset,
  PaymentNetwork,
  PayLinkRecord,
  PayLinkType,
  WalletType
} from "@/lib/types";
import { buildPaymentUrl, expiryToTimestamp, generateRandomTag } from "@/lib/utils";

type CreatePayload = {
  amount?: string | null;
  token?: PaymentAsset;
  network?: PaymentNetwork;
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

    const isSolanaCreatorWallet = (() => {
      try {
        new PublicKey(creatorWallet);
        return true;
      } catch {
        return false;
      }
    })();

    if (!isSolanaCreatorWallet && !isAddress(creatorWallet)) {
      return NextResponse.json(
        { error: "Please connect your wallet first" },
        { status: 400 }
      );
    }

    const ownerTagRecord = await getPriviiTagByOwner(creatorWallet);
    const requestedNetwork =
      body.network === "ethereum" || body.network === "base" || body.network === "arbitrum" || body.network === "bsc"
        ? body.network
        : body.network === "solana"
          ? "solana"
          : null;
    const hasSolanaWallet = ownerTagRecord
      ? hasTagSolanaWallet(ownerTagRecord)
      : isSolanaCreatorWallet;
    const hasEvmWallet = ownerTagRecord ? hasTagEvmWallet(ownerTagRecord) : !isSolanaCreatorWallet;
    const network: PaymentNetwork =
      requestedNetwork ||
      (hasSolanaWallet ? "solana" : "ethereum");
    const creatorWalletType: WalletType = network === "solana" ? "solana" : "evm";

    if (network === "solana" && !hasSolanaWallet) {
      return NextResponse.json(
        { error: "Link a wallet for this network first" },
        { status: 400 }
      );
    }

    if (network !== "solana" && !hasEvmWallet) {
      return NextResponse.json(
        { error: "Link a wallet for this network first" },
        { status: 400 }
      );
    }
    const token: PaymentAsset =
      body.token === "ETH" || body.token === "BNB" || body.token === "USDT" || body.token === "USDC" || body.token === "SOL"
        ? body.token
        : network === "solana"
          ? "USDC"
          : network === "bsc"
            ? "BNB"
            : "ETH";
    const recipientWallet =
      ownerTagRecord
        ? network === "solana"
          ? resolveTagSolanaWallet(ownerTagRecord) || null
          : resolveTagEvmWallet(ownerTagRecord)
        : creatorWalletType === "solana"
          ? creatorWallet
          : creatorWallet;

    if (!recipientWallet) {
      return NextResponse.json(
        {
          error:
            network === "solana"
              ? "Link a wallet for this network first"
              : "Link a wallet for this network first"
        },
        { status: 422 }
      );
    }

    if (network === "solana") {
      try {
        new PublicKey(recipientWallet);
      } catch {
        return NextResponse.json(
          { error: "Link a wallet for this network first" },
          { status: 422 }
        );
      }
    } else if (!isAddress(recipientWallet)) {
      return NextResponse.json(
        { error: "Link a wallet for this network first" },
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
      token,
      network,
      walletType: creatorWalletType,
      receiverWallet: recipientWallet,
      type,
      expiryOption,
      expiresAt,
      recipientWallet,
      createdAt: Date.now(),
      creatorWallet,
      creatorTag: ownerTagRecord?.tag ?? null,
      paymentPurpose: body.paymentPurpose?.trim() || null,
      ownerTag: ownerTagRecord?.tag ?? null,
      receiverTag: ownerTagRecord?.tag ?? null,
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
