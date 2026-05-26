import type { PropsWithChildren } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  hideWalletButton,
  largeLogo,
  marketing
}: PropsWithChildren<{
  className?: string;
  hideWalletButton?: boolean;
  largeLogo?: boolean;
  marketing?: boolean;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-primary">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_50%_0%,rgba(91,45,255,0.18),transparent_35%),radial-gradient(circle_at_88%_10%,rgba(0,163,255,0.08),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[340px] bg-[radial-gradient(circle_at_50%_100%,rgba(91,45,255,0.08),transparent_36%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-18 pt-0 sm:px-6 sm:pt-0 lg:px-8">
        <SiteHeader hideWalletButton={hideWalletButton} largeLogo={largeLogo} marketing={marketing} />
        <main className={cn("relative flex-1", className)}>{children}</main>
        <SiteFooter marketing={marketing} />
      </div>
    </div>
  );
}
