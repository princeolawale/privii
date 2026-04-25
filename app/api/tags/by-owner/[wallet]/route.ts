import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getPriviiTagByOwner } from "@/lib/tags";

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

  const record = await getPriviiTagByOwner(normalizedWallet);

  if (!record) {
    return NextResponse.json(
      { error: "No Privii tag found for this wallet." },
      { status: 404 }
    );
  }

  return NextResponse.json({ tag: record });
}
