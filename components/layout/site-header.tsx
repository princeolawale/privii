"use client";

import { ArrowRight, Menu, Send, Shield, UserCircle2, X as CloseIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { useOwnerTag } from "@/components/solana/use-owner-tag";
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
  const navItems = marketing ? marketingNavItems : appNavItems;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 mb-7 flex items-center justify-between rounded-[28px] border border-white/[0.05] bg-black/45 px-4 py-3 backdrop-blur-xl sm:px-5",
          marketing ? "mb-6" : "mb-8"
        )}
      >
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
          <div className="flex items-center gap-3 pl-3">
            <Link href={hasTag ? "/dashboard" : "/dashboard"} className="text-sm text-secondary transition hover:text-primary">
              {hasTag ? "Dashboard" : "Sign in"}
            </Link>
            {hasTag ? (
              <Link href="/create">
                <Button className="min-h-11 rounded-xl px-4 text-sm">Create Link</Button>
              </Link>
            ) : (
              <Link href="/get-started">
                <Button className="min-h-11 rounded-xl px-4 text-sm">
                  {pathname === "/get-started" ? "Create ID" : "Create ID"}
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <button
            aria-expanded={open}
            aria-label="Toggle menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-primary transition hover:border-accent/30 hover:bg-white/[0.05]"
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
            "w-full rounded-[24px] border border-white/[0.06] bg-[#0B0B0D] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.35)]"
          )}
        >
          <div className="flex flex-col gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-2 py-1 text-[16px] text-secondary transition hover:text-primary"
                onClick={() => setOpen(false)}
              >
                <span className="text-accent/90">
                  {item.label === "Product" ? <Shield className="h-4 w-4" /> : null}
                  {item.label === "Features" ? <ArrowRight className="h-4 w-4" /> : null}
                  {item.label === "Use Cases" ? <UserCircle2 className="h-4 w-4" /> : null}
                  {item.label === "Docs" ? <ArrowRight className="h-4 w-4" /> : null}
                  {item.label === "About" ? <Shield className="h-4 w-4" /> : null}
                </span>
                {item.label}
              </Link>
            ))}

            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-1">
              <Link
                href={hasTag ? "/dashboard" : "/dashboard"}
                className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-sm font-medium text-primary transition hover:bg-black/45"
                onClick={() => setOpen(false)}
              >
                {hasTag ? "Dashboard" : "Sign in"}
              </Link>
              <Link
                href={hasTag ? "/create" : "/get-started"}
                className="flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_55%,#7C4DFF_100%)] text-sm font-medium text-white shadow-[0_16px_40px_rgba(91,45,255,0.22)] transition hover:-translate-y-0.5"
                onClick={() => setOpen(false)}
              >
                {hasTag ? "Create Link" : "Create ID"}
              </Link>
            </div>
      
            <div className="border-t border-white/10 pt-5">
              <div className="space-y-4">
                <a
                  href="https://x.com/clinksdotone?s=21"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-2 py-1 text-[16px] text-secondary transition hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon className="h-4 w-4" />
                  X
                </a>
                <a
                  href="https://t.me/clinksdotone"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-2 py-1 text-[16px] text-secondary transition hover:text-primary"
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

const marketingNavItems = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/#use-cases", label: "Use Cases" },
  { href: "/about#docs", label: "Docs" },
  { href: "/about", label: "About" }
];

const appNavItems = marketingNavItems;
