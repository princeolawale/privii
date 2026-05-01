import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { getPriviiTagByOwner } from "@/lib/tags";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const normalizedWallet = decodeURIComponent(wallet).trim();

  const isSolanaAddress = (() => {
    try {
      new PublicKey(normalizedWallet);
      return true;
    } catch {
      return false;
    }
  })();

  if (!isSolanaAddress && !isAddress(normalizedWallet)) {
    return NextResponse.json(
      { error: "Wallet is not a valid address." },
      { status: 400 }
    );
  }

  const record = await getPriviiTagByOwner(normalizedWallet);

  if (!record) {
    return NextResponse.json(
      { error: "No Privii tag found for this wallet." },
      { status: 404 }
    );
  }

  return NextResponse.json({ tag: record });
}
