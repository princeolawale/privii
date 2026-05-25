"use client";

import { Menu, Send, X as CloseIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { useOwnerTag } from "@/components/solana/use-owner-tag";
import { ConnectMenuButton } from "@/components/wallet/connect-menu-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({
  hideWalletButton = false,
  largeLogo = false,
  marketing = false
}: {
  hideWalletButton?: boolean;
  largeLogo?: boolean;
  marketing?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { hasTag } = useOwnerTag();
  const isHome = pathname === "/";
  const navItems = marketing
    ? marketingNavItems
    : hasTag
    ? [
        { href: "/", label: "Home" },
        { href: "/create", label: "Create Link" },
        { href: "/dashboard", label: "Dashboard" }
      ]
    : baseNavItems;

  return (
    <>
      <header className={cn("flex items-center justify-between", marketing ? "mb-5" : "mb-7")}>
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
          {marketing ? (
            <div className="flex items-center gap-3 pl-3">
              <Link href="/dashboard" className="text-sm text-secondary transition hover:text-primary">
                Sign in
              </Link>
              <Link href="/get-started">
                <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_55%,#7C4DFF_100%)] px-4 text-sm font-medium text-white shadow-[0_16px_40px_rgba(91,45,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(91,45,255,0.28)]">
                  Create ID
                </button>
              </Link>
            </div>
          ) : (
            <>
              {!hasTag ? (
                <Link href="/get-started">
                  <Button className="min-w-[140px]">Get Started</Button>
                </Link>
              ) : null}
              {!hideWalletButton ? (
                <ConnectMenuButton className="min-h-12 rounded-xl px-4 text-sm shadow-[0_0_0_1px_rgba(0,240,181,0.08),0_12px_28px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,240,181,0.08)]" />
              ) : null}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          {!marketing && !hideWalletButton ? (
            <ConnectMenuButton className="min-h-11 rounded-xl px-4 text-sm shadow-[0_0_0_1px_rgba(0,240,181,0.08),0_10px_24px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,240,181,0.08)]" />
          ) : null}
          <button
            aria-expanded={open}
            aria-label="Toggle menu"
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-[26px] border text-primary transition backdrop-blur",
              isHome
                ? "border-accent/25 bg-black/35 shadow-[0_18px_40px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-accent/40 hover:bg-black/45"
                : "border-border bg-card hover:border-mint/25 hover:bg-mint/8"
            )}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          open ? "mb-8 max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div
          className={cn(
            "ml-auto w-full max-w-[390px] rounded-[32px] p-5 backdrop-blur-xl",
            isHome
              ? "border border-white/10 bg-black/45 shadow-[0_30px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]"
              : "border border-border bg-card/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          )}
        >
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

            {marketing ? (
              <div className={cn("grid grid-cols-2 gap-3 pt-1", isHome ? "border-t border-white/10" : "border-t border-border/80")}>
                <Link
                  href="/dashboard"
                  className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-sm font-medium text-primary transition hover:bg-black/45"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/get-started"
                  className="flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_55%,#7C4DFF_100%)] text-sm font-medium text-white shadow-[0_16px_40px_rgba(91,45,255,0.22)] transition hover:-translate-y-0.5"
                  onClick={() => setOpen(false)}
                >
                  Create ID
                </Link>
              </div>
            ) : null}
      
            <div className={cn("pt-5", isHome ? "border-t border-white/10" : "border-t border-border/80")}>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://x.com/clinksdotone?s=21"
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-base font-medium text-primary transition backdrop-blur",
                    isHome
                      ? "border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-accent/25 hover:bg-black/45"
                      : "border-border bg-background/70 hover:border-mint/25 hover:bg-mint/10"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon className="h-4 w-4" />
                  X
                </a>
                <a
                  href="https://t.me/clinksdotone"
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-base font-medium text-primary transition backdrop-blur",
                    isHome
                      ? "border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-accent/25 hover:bg-black/45"
                      : "border-border bg-background/70 hover:border-mint/25 hover:bg-mint/10"
                  )}
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

const marketingNavItems = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/#use-cases", label: "Use Cases" },
  { href: "/#docs", label: "Docs" },
  { href: "/#about", label: "About" }
];
