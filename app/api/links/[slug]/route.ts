import { NextResponse } from "next/server";

import { getPayLink } from "@/lib/paylinks";
import { isExpired } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const link = await getPayLink(slug);

  if (!link) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }

  return NextResponse.json({
    link,
    status: isExpired(link.expiresAt) ? "expired" : "active"
  });
}
