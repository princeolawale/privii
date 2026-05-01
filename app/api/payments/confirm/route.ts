import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { confirmAndSavePayment, parseDecimalAmount } from "@/lib/payments";
import { getPayLink } from "@/lib/paylinks";
import { getPriviiTag, resolveTagEvmWallet, resolveTagSolanaWallet } from "@/lib/tags";
import type { PaymentAsset, PaymentNetwork } from "@/lib/types";
import { isExpired, normalizePriviiTag } from "@/lib/utils";

type ConfirmPayload = {
  kind?: "tag" | "paylink";
  tag?: string;
  asset?: PaymentAsset;
  network?: PaymentNetwork;
  expectedAmount?: string;
  payerWallet?: string;
  txSignature?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConfirmPayload;
    const kind = body.kind === "tag" ? "tag" : "paylink";
    const tag = normalizePriviiTag(body.tag ?? "");
    const txSignature = body.txSignature?.trim() ?? "";
    const network: PaymentNetwork =
      body.network === "ethereum" ||
      body.network === "base" ||
      body.network === "arbitrum" ||
      body.network === "bsc"
        ? body.network
        : "solana";
    const payerWallet = body.payerWallet?.trim() ?? "";

    if (!tag || !payerWallet || !txSignature) {
      return NextResponse.json({ error: "Payment failed. Please try again" }, { status: 400 });
    }

    if (network === "solana") {
      try {
        new PublicKey(payerWallet);
      } catch {
        return NextResponse.json({ error: "Please connect your wallet first" }, { status: 400 });
      }
    } else if (!isAddress(payerWallet)) {
      return NextResponse.json({ error: "Please connect your wallet first" }, { status: 400 });
    }

    if (kind === "tag") {
      const record = await getPriviiTag(tag);

      if (!record) {
        return NextResponse.json({ error: "Privii tag not found" }, { status: 404 });
      }

      const recipientWallet =
        network === "solana" ? resolveTagSolanaWallet(record) : resolveTagEvmWallet(record);

      if (!recipientWallet) {
        return NextResponse.json(
          {
            error:
              network === "solana"
                ? "Recipient wallet not configured for this tag."
                : "This user has not added an EVM wallet yet"
          },
          { status: 422 }
        );
      }

      if (network === "solana") {
        try {
          new PublicKey(recipientWallet);
        } catch {
          return NextResponse.json(
            { error: "Recipient wallet not configured for this tag." },
            { status: 422 }
          );
        }
      } else if (!isAddress(recipientWallet)) {
        return NextResponse.json(
          { error: "This user has not added an EVM wallet yet" },
          { status: 422 }
        );
      }

      const asset: PaymentAsset =
        body.asset === "ETH" ||
        body.asset === "BNB" ||
        body.asset === "USDT" ||
        body.asset === "USDC" ||
        body.asset === "SOL"
          ? body.asset
          : network === "solana"
            ? "USDC"
            : network === "bsc"
              ? "BNB"
              : "ETH";
      const expectedAmount = body.expectedAmount?.trim() ?? "";
      const decimals =
        asset === "SOL" ? 9 : asset === "USDC" || asset === "USDT" ? 6 : 18;

      if (!parseDecimalAmount(expectedAmount, decimals) || Number(expectedAmount) <= 0) {
        return NextResponse.json({ error: "Enter an amount to continue" }, { status: 400 });
      }

      const result = await confirmAndSavePayment({
        tag: record.tag,
        receiverTag: record.tag,
        recipientWallet,
        payerWallet,
        asset,
        chain: network,
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

    let recipientWallet = link.recipientWallet?.trim() || null;
    let receiverTag = link.creatorTag ?? link.ownerTag ?? null;

    if (receiverTag) {
      const tagRecord = await getPriviiTag(receiverTag);

      if (tagRecord) {
        recipientWallet =
          network === "solana"
            ? resolveTagSolanaWallet(tagRecord) || recipientWallet
            : resolveTagEvmWallet(tagRecord);
        receiverTag = tagRecord.tag;
      }
    }

    if (!recipientWallet) {
      return NextResponse.json(
        {
          error:
            network === "solana"
              ? "Recipient wallet not configured for this tag."
              : "This user has not added an EVM wallet yet"
        },
        { status: 422 }
      );
    }

    if (network === "solana") {
      try {
        new PublicKey(recipientWallet);
      } catch {
        return NextResponse.json(
          { error: "Recipient wallet not configured for this tag." },
          { status: 422 }
        );
      }
    } else if (!isAddress(recipientWallet)) {
      return NextResponse.json(
        { error: "This user has not added an EVM wallet yet" },
        { status: 422 }
      );
    }

    const asset: PaymentAsset =
      body.asset === "ETH" ||
      body.asset === "BNB" ||
      body.asset === "USDT" ||
      body.asset === "USDC" ||
      body.asset === "SOL"
        ? body.asset
        : link.token;
    const expectedAmount = link.amount?.trim() || body.expectedAmount?.trim() || "";
    const decimals =
      asset === "SOL" ? 9 : asset === "USDC" || asset === "USDT" ? 6 : 18;

    if (!parseDecimalAmount(expectedAmount, decimals) || Number(expectedAmount) <= 0) {
      return NextResponse.json({ error: "Enter an amount to continue" }, { status: 400 });
    }

    const result = await confirmAndSavePayment({
      tag: link.tag,
      receiverTag,
      recipientWallet,
      payerWallet,
      asset,
      chain: network,
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
