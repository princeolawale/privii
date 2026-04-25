import type { PropsWithChildren } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  hideWalletButton,
  largeLogo
}: PropsWithChildren<{
  className?: string;
  hideWalletButton?: boolean;
  largeLogo?: boolean;
}>) {
  return (
    <div className="min-h-screen bg-background bg-accent-radial text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <SiteHeader hideWalletButton={hideWalletButton} largeLogo={largeLogo} />
        <main className={cn("flex-1", className)}>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
