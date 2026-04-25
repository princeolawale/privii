import type { PropsWithChildren } from "react";
import Link from "next/link";

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function V2Shell({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#05060A] text-primary">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.22),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(124,92,255,0.14),transparent_25%),linear-gradient(180deg,#07070C_0%,#05060A_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/v2" className="text-xl font-semibold tracking-[-0.04em] text-primary">
            Privii v2
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="rounded-full px-4 py-2">
                Current app
              </Button>
            </Link>
            <ConnectWalletButton className="!h-10 !rounded-full !border-white/12 !bg-white/6 !text-white" />
          </div>
        </header>
        <main className={cn("flex-1", className)}>{children}</main>
      </div>
    </div>
  );
}
