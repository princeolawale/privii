import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { getPriviiTag, savePriviiTag } from "@/lib/tags";
import { normalizePriviiTag } from "@/lib/utils";

type UpdateTagPayload = {
  ownerWallet?: string;
  solanaWallet?: string | null;
  evmWallet?: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;
  const record = await getPriviiTag(normalizePriviiTag(tag));

  if (!record) {
    return NextResponse.json({ error: "Privii tag not found" }, { status: 404 });
  }

  return NextResponse.json({ tag: record });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const normalizedTag = normalizePriviiTag(tag);
    const record = await getPriviiTag(normalizedTag);

    if (!record) {
      return NextResponse.json({ error: "Privii tag not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateTagPayload;
    const ownerWallet = body.ownerWallet?.trim();

    if (!ownerWallet) {
      return NextResponse.json({ error: "Please connect your wallet first" }, { status: 400 });
    }

    const isSolanaOwner = (() => {
      try {
        new PublicKey(ownerWallet);
        return true;
      } catch {
        return false;
      }
    })();

    if (!isSolanaOwner && !isAddress(ownerWallet)) {
      return NextResponse.json({ error: "Owner wallet is not a valid address." }, { status: 400 });
    }

    if (
      record.ownerWallet !== ownerWallet &&
      record.solanaWallet !== ownerWallet &&
      record.evmWallet !== ownerWallet
    ) {
      return NextResponse.json({ error: "Only the tag owner can update this record." }, { status: 403 });
    }

    const solanaWallet = body.solanaWallet?.trim() || record.solanaWallet?.trim() || null;
    const evmWallet = body.evmWallet?.trim() || null;

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
      return NextResponse.json({ error: "EVM wallet is not a valid address." }, { status: 400 });
    }

    const updated = {
      ...record,
      ownerWallet: record.ownerWallet || solanaWallet || evmWallet || ownerWallet,
      recipientWallet: solanaWallet || record.recipientWallet || null,
      solanaWallet,
      evmWallet,
    };

    await savePriviiTag(updated);

    return NextResponse.json({ tag: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update Privii tag." }, { status: 500 });
  }
}
