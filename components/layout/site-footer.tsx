import Link from "next/link";
import { Send } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border/80 pt-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 pb-6 text-center">
        <div className="space-y-3">
          <BrandMark className="justify-center" />
          <p className="max-w-md text-sm leading-6 text-secondary">
            Seamless crypto payments with tags and links.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://x.com/clinksdotone?s=21"
            target="_blank"
            rel="noreferrer"
            aria-label="Clinks on X"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:border-accent/25 hover:bg-accent/10"
          >
            <span className="text-xl font-medium">X</span>
          </a>
          <a
            href="https://t.me/clinksdotone"
            target="_blank"
            rel="noreferrer"
            aria-label="Clinks on Telegram"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:border-mint/25 hover:bg-mint/10"
          >
            <Send className="h-5 w-5" />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-secondary">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <Link href="/create" className="transition hover:text-primary">
            Create
          </Link>
          <Link href="/dashboard" className="transition hover:text-primary">
            Dashboard
          </Link>
          <Link href="/#how-it-works" className="transition hover:text-primary">
            How it Works
          </Link>
        </div>

        <p className="text-sm text-secondary">© 2026 Clinks. All rights reserved.</p>
      </div>
    </footer>
  );
}
