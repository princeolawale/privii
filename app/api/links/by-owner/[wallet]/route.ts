import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";

import { getPayLinksByOwner } from "@/lib/paylinks";

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

  const links = await getPayLinksByOwner(normalizedWallet);
  return NextResponse.json({ links });
}
