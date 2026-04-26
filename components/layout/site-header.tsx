"use client";

import { Menu, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { useOwnerTag } from "@/components/solana/use-owner-tag";
import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/get-started", label: "Get Started" }, 
  { href: "/create", label: "Create Link" },
  { href: "/dashboard", label: "Dashboard" }
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
  const { hasTag } = useOwnerTag();
  const navItems = hasTag
    ? [
        { href: "/", label: "" },
        { href: "/create", label: "Create Link" },
        { href: "/dashboard", label: "Dashboard" }
      ]
    : baseNavItems;

  return (
    <>
      <header className="mb-12 flex items-center justify-between">
        <BrandMark />

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
          {!hasTag ? (
            <Link href="/get-started">
              <Button className="min-w-[140px]">Get Started</Button>
            </Link>
          ) : null}
          {!hideWalletButton ? <ConnectWalletButton /> : null}
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          {!hideWalletButton ? (
            <ConnectWalletButton className="!min-h-12 !rounded-2xl !px-4 !text-sm" />
          ) : null}
          <button
            aria-expanded={open}
            aria-label="Toggle menu"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-primary transition hover:border-white/15 hover:bg-white/[0.03]"
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
          <div className="flex flex-col gap-6">
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
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-base font-medium text-primary transition hover:border-white/20 hover:bg-white/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  <span className="text-lg font-medium">X</span>
                </a>
                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-base font-medium text-primary transition hover:border-white/20 hover:bg-white/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  <Send className="h-4 w-4" />
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const baseNavItems = [
  { href: "/", label: "Home" },
  { href: "/get-started", label: "Get Started" }, 
  { href: "/create", label: "Create Link" },
  { href: "/dashboard", label: "Dashboard" }
];
