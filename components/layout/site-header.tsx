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
  { href: "/create", label: "Create" },
  { href: "/#how-it-works", label: "How it Works" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
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
          <ConnectWalletButton />
        </nav>

        <button
          aria-expanded={open}
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary transition hover:border-white/15 hover:bg-white/[0.03] md:hidden"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          open ? "mb-8 max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="rounded-[28px] border border-border bg-card p-4">
          <div className="mb-4">
            <ConnectWalletButton className="!w-full" />
          </div>
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-3 py-3 text-sm text-secondary transition hover:bg-white/[0.03] hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://x.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl px-3 py-3 text-sm text-secondary transition hover:bg-white/[0.03] hover:text-primary"
              onClick={() => setOpen(false)}
            >
              X
            </a>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl px-3 py-3 text-sm text-secondary transition hover:bg-white/[0.03] hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Telegram
            </a>
            <Link href="/create" onClick={() => setOpen(false)}>
              <Button className="mt-2 w-full">Create PayLink</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
