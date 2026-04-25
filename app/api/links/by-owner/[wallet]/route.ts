import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getPayLinksByOwner } from "@/lib/paylinks";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const normalizedWallet = decodeURIComponent(wallet).trim();

  try {
    new PublicKey(normalizedWallet);
  } catch {
    return NextResponse.json(
      { error: "Wallet is not a valid Solana address." },
      { status: 400 }
    );
  }

  const links = await getPayLinksByOwner(normalizedWallet);
  return NextResponse.json({ links });
}
