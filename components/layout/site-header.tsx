"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How it Works" }
];

export function SiteHeader({
  hideWalletButton = false,
  largeLogo = false
}: {
  hideWalletButton?: boolean;
  largeLogo?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="mb-10 flex items-center justify-between">
        <Link
          href="/"
          className={cn(
            "font-semibold tracking-tight text-primary",
            largeLogo ? "text-[2.1rem]" : "text-lg"
          )}
        >
          {APP_NAME}
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition hover:text-primary",
                pathname === item.href && "text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
          {!hideWalletButton ? <ConnectWalletButton /> : null}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {!hideWalletButton ? (
            <ConnectWalletButton className="!h-10 !px-4 !text-sm" />
          ) : null}
          <button
            aria-expanded={open}
            aria-label="Toggle menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:border-white/15 hover:bg-white/[0.03]"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          open ? "mb-8 max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-auto w-full max-w-[390px] rounded-[32px] border border-white/10 bg-[#111111]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex flex-col gap-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2 py-1 text-[17px] text-secondary transition hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/8 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.02] text-lg text-primary transition hover:border-white/20 hover:bg-white/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  X
                </a>
                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.02] text-lg text-primary transition hover:border-white/20 hover:bg-white/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  Telegram
                </a>
              </div>
            </div>
            <Link href="/create" onClick={() => setOpen(false)}>
              <Button className="mt-1 h-16 w-full rounded-[999px] text-xl">Create PayLink</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
