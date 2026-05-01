import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { tagExists } from "@/lib/paylinks";
import { getPriviiTagByOwner, priviiTagExists, savePriviiTag } from "@/lib/tags";
import type { PriviiTagRecord } from "@/lib/types";
import {
  buildFallbackTagUrl,
  buildPrimaryTagUrl,
  isValidPriviiTag,
  normalizePriviiTag
} from "@/lib/utils";

type CreateTagPayload = {
  tag?: string;
  ownerWallet?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTagPayload;
    const tag = normalizePriviiTag(body.tag ?? "");
    const ownerWallet = body.ownerWallet?.trim();

    if (!isValidPriviiTag(tag)) {
      return NextResponse.json(
        {
          error: "Use lowercase letters, numbers, or hyphens only"
        },
        { status: 400 }
      );
    }

    if (!ownerWallet) {
      return NextResponse.json({ error: "Owner wallet is required." }, { status: 400 });
    }

    try {
      new PublicKey(ownerWallet);
    } catch {
      return NextResponse.json(
        { error: "Owner wallet is not a valid Solana address." },
        { status: 400 }
      );
    }

    if ((await priviiTagExists(tag)) || (await tagExists(tag))) {
      return NextResponse.json(
        { error: "This Privii tag is already taken" },
        { status: 409 }
      );
    }

    const existingTag = await getPriviiTagByOwner(ownerWallet);

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
      recipientWallet: ownerWallet,
      solanaWallet: ownerWallet,
      evmWallet: null,
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
