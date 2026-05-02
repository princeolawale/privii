import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { getPriviiTag, savePriviiTag } from "@/lib/tags";
import type { WalletType } from "@/lib/types";
import { normalizePriviiTag } from "@/lib/utils";

type UpdateWalletPayload = {
  walletType?: WalletType;
  walletAddress?: string;
  ownerWallet?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const record = await getPriviiTag(normalizePriviiTag(tag));

    if (!record) {
      return NextResponse.json({ error: "Privii tag not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateWalletPayload;
    const walletType = body.walletType;
    const walletAddress = body.walletAddress?.trim() ?? "";
    const ownerWallet = body.ownerWallet?.trim() ?? "";

    if (walletType !== "evm" && walletType !== "solana") {
      return NextResponse.json({ error: "Failed to link wallet. Please try again" }, { status: 400 });
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "Enter a wallet address" }, { status: 400 });
    }

    if (!ownerWallet) {
      return NextResponse.json({ error: "You do not own this tag" }, { status: 403 });
    }

    const normalizedOwner = ownerWallet.toLowerCase();
    const tagWallets = [
      record.ownerWallet,
      record.solanaWallet,
      record.evmWallet,
      record.walletAddress,
      record.recipientWallet
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim().toLowerCase());

    if (!tagWallets.includes(normalizedOwner)) {
      return NextResponse.json({ error: "You do not own this tag" }, { status: 403 });
    }

    if (walletType === "evm") {
      if (!isAddress(walletAddress)) {
        return NextResponse.json({ error: "Invalid EVM address" }, { status: 400 });
      }

      if (record.evmWallet?.trim()) {
        return NextResponse.json({ error: "Wallet already linked" }, { status: 409 });
      }

      const updated = {
        ...record,
        evmWallet: walletAddress
      };

      await savePriviiTag(updated);
      return NextResponse.json({ tag: updated });
    }

    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({ error: "Invalid Solana address" }, { status: 400 });
    }

    if (record.solanaWallet?.trim() || record.recipientWallet?.trim()) {
      return NextResponse.json({ error: "Wallet already linked" }, { status: 409 });
    }

    const updated = {
      ...record,
      solanaWallet: walletAddress,
      recipientWallet: record.recipientWallet || walletAddress
    };

    await savePriviiTag(updated);
    return NextResponse.json({ tag: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to link wallet. Please try again" },
      { status: 500 }
    );
  }
}
