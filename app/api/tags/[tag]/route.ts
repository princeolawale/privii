import { NextResponse } from "next/server";

import { getPriviiTag } from "@/lib/tags";
import { normalizePriviiTag } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;
  const record = await getPriviiTag(normalizePriviiTag(tag));

  if (!record) {
    return NextResponse.json({ error: "Privii tag not found." }, { status: 404 });
  }

  return NextResponse.json({ tag: record });
}
