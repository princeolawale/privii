import { NextResponse, type NextRequest } from "next/server";

import { extractTagFromHost, shouldSkipSubdomainRewrite } from "@/lib/host";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (shouldSkipSubdomainRewrite(host)) {
    return NextResponse.next();
  }

  const tag = extractTagFromHost(host);

  if (!tag) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const rewrittenPath = pathname === "/" ? `/${tag}` : `/${tag}${pathname}`;
  const rewriteUrl = request.nextUrl.clone();

  rewriteUrl.pathname = rewrittenPath;
  rewriteUrl.search = search;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|json|map)$).*)"
  ]
};
