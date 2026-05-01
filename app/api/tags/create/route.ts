import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { tagExists } from "@/lib/paylinks";
import { getPriviiTagByOwner, priviiTagExists, savePriviiTag } from "@/lib/tags";
import type { PriviiTagRecord, WalletType } from "@/lib/types";
import {
  buildFallbackTagUrl,
  buildPrimaryTagUrl,
  isValidPriviiTag,
  normalizePriviiTag
} from "@/lib/utils";

type CreateTagPayload = {
  tag?: string;
  ownerWallet?: string;
  walletType?: WalletType;
  chainId?: string | number | null;
  solanaWallet?: string | null;
  evmWallet?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTagPayload;
    const tag = normalizePriviiTag(body.tag ?? "");
    const requestedWalletType = body.walletType === "evm" ? "evm" : "solana";
    const chainId = body.chainId ?? null;
    const solanaWallet = body.solanaWallet?.trim() || null;
    const evmWallet = body.evmWallet?.trim() || null;
    const walletType =
      requestedWalletType === "evm"
        ? evmWallet
          ? "evm"
          : null
        : solanaWallet
          ? "solana"
          : null;
    const walletAddress =
      walletType === "evm" ? evmWallet : walletType === "solana" ? solanaWallet : null;
    const ownerWallet = body.ownerWallet?.trim() || walletAddress || "";

    if (!isValidPriviiTag(tag)) {
      return NextResponse.json(
        {
          error: "Use lowercase letters, numbers, or hyphens only"
        },
        { status: 400 }
      );
    }

    if (!walletType || !walletAddress) {
      return NextResponse.json(
        { error: "Connect at least one wallet to continue" },
        { status: 400 }
      );
    }

    if (solanaWallet) {
      try {
        new PublicKey(solanaWallet);
      } catch {
        return NextResponse.json(
          { error: "Solana wallet is not a valid address." },
          { status: 400 }
        );
      }
    }

    if (evmWallet && !isAddress(evmWallet)) {
      return NextResponse.json(
        { error: "EVM wallet is not a valid address." },
        { status: 400 }
      );
    }

    if ((await priviiTagExists(tag)) || (await tagExists(tag))) {
      return NextResponse.json(
        { error: "This Privii tag is already taken" },
        { status: 409 }
      );
    }

    const existingTag =
      (solanaWallet ? await getPriviiTagByOwner(solanaWallet) : null) ||
      (evmWallet ? await getPriviiTagByOwner(evmWallet) : null) ||
      (ownerWallet ? await getPriviiTagByOwner(ownerWallet) : null);

    if (existingTag) {
      return NextResponse.json(
        {
          error: "This wallet already has a registered Privii tag.",
          tag: existingTag
        },
        { status: 409 }
      );
    }

    const record: PriviiTagRecord = {
      tag,
      ownerWallet,
      walletType,
      walletAddress,
      chainId,
      recipientWallet: walletType === "solana" ? solanaWallet : null,
      solanaWallet: walletType === "solana" ? solanaWallet : null,
      evmWallet: walletType === "evm" ? evmWallet : null,
      createdAt: new Date().toISOString(),
      status: "active",
      primaryUrl: buildPrimaryTagUrl(tag),
      fallbackUrl: buildFallbackTagUrl(tag),
      stealthEnabled: false,
      stealthMode: "coming_soon"
    };

    await savePriviiTag(record);

    return NextResponse.json({ tag: record });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create Privii tag."
      },
      { status: 500 }
    );
  }
}
