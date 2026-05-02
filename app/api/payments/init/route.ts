import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { parseDecimalAmount } from "@/lib/payments";
import { getPayLink } from "@/lib/paylinks";
import { getPriviiTag, resolveTagEvmWallet, resolveTagSolanaWallet } from "@/lib/tags";
import type { PaymentAsset, PaymentNetwork } from "@/lib/types";
import { isExpired, normalizePriviiTag } from "@/lib/utils";

type PaymentInitPayload = {
  kind?: "tag" | "paylink";
  tag?: string;
  asset?: PaymentAsset;
  network?: PaymentNetwork;
  expectedAmount?: string;
  payerWallet?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PaymentInitPayload;
    const kind = body.kind === "tag" ? "tag" : "paylink";
    const tag = normalizePriviiTag(body.tag ?? "");
    const payerWallet = body.payerWallet?.trim() || null;
    const requestedNetwork: PaymentNetwork =
      body.network === "ethereum" ||
      body.network === "base" ||
      body.network === "arbitrum" ||
      body.network === "bsc"
        ? body.network
        : "solana";

    if (payerWallet) {
      if (requestedNetwork === "solana") {
        try {
          new PublicKey(payerWallet);
        } catch {
          return NextResponse.json({ error: "Please connect your wallet first" }, { status: 400 });
        }
      } else if (!isAddress(payerWallet)) {
        return NextResponse.json({ error: "Please connect your wallet first" }, { status: 400 });
      }
    }

    if (!tag) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 400 });
    }

    if (kind === "tag") {
      const record = await getPriviiTag(tag);

      if (!record) {
        return NextResponse.json({ error: "Privii tag not found" }, { status: 404 });
      }

      const network: PaymentNetwork = requestedNetwork;
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
      const networkRecipientWallet =
        network === "solana" ? resolveTagSolanaWallet(record) : resolveTagEvmWallet(record);

      if (!networkRecipientWallet) {
        return NextResponse.json(
          {
            error:
              network === "solana"
                ? "This tag has no Solana wallet linked"
                : "This tag has no EVM wallet linked"
          },
          { status: 422 }
        );
      }

      if (network === "solana") {
        try {
          new PublicKey(networkRecipientWallet);
        } catch {
          return NextResponse.json(
            { error: "This tag has no Solana wallet linked" },
            { status: 422 }
          );
        }
      } else if (!isAddress(networkRecipientWallet)) {
        return NextResponse.json(
          { error: "This tag has no EVM wallet linked" },
          { status: 422 }
        );
      }

      const expectedAmount = body.expectedAmount?.trim() ?? "";

      const decimals =
        asset === "SOL" ? 9 : asset === "USDC" || asset === "USDT" ? 6 : 18;

      if (!parseDecimalAmount(expectedAmount, decimals) || Number(expectedAmount) <= 0) {
        return NextResponse.json({ error: "Enter an amount to continue" }, { status: 400 });
      }

      return NextResponse.json({
        payment: {
          kind: "tag" as const,
          tag: record.tag,
          asset,
          network,
          expectedAmount,
          payerWallet,
          recipientWallet: networkRecipientWallet,
          expiresAt: null,
          expired: false
        }
      });
    }

    const link = await getPayLink(tag);

    if (!link) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    const walletType = link.walletType || "solana";
    const network: PaymentNetwork =
      walletType === "solana" ? "solana" : link.network || "ethereum";
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

    let networkRecipientWallet = link.recipientWallet?.trim() || null;

    if (link.creatorTag) {
      const creatorTag = await getPriviiTag(link.creatorTag);

      if (creatorTag) {
        networkRecipientWallet =
          network === "solana"
            ? resolveTagSolanaWallet(creatorTag) || networkRecipientWallet
            : resolveTagEvmWallet(creatorTag) || networkRecipientWallet;
      }
    }

    if (!networkRecipientWallet) {
      return NextResponse.json(
        {
          error:
            network === "solana"
              ? "This tag has no Solana wallet linked"
              : "This tag has no EVM wallet linked"
        },
        { status: 422 }
      );
    }

    if (network === "solana") {
      try {
        new PublicKey(networkRecipientWallet);
      } catch {
        return NextResponse.json(
          { error: "This tag has no Solana wallet linked" },
          { status: 422 }
        );
      }
    } else if (!isAddress(networkRecipientWallet)) {
      return NextResponse.json(
        { error: "This tag has no EVM wallet linked" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      payment: {
        kind: "paylink" as const,
        tag: link.tag,
        asset,
        network,
        expectedAmount,
        payerWallet,
        recipientWallet: networkRecipientWallet,
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
