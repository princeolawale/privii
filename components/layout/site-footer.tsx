import Link from "next/link";
import { Send } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/80 pt-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 pb-6 text-center">
        <div className="space-y-3">
          <Link href="/" className="text-3xl font-semibold tracking-tight text-primary">
            {APP_NAME}
          </Link>
          <p className="max-w-md text-sm leading-6 text-secondary">
            Simple crypto payments with tags and links.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://x.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Privii on X"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
          >
            <span className="text-xl font-medium">X</span>
          </a>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            aria-label="Privii on Telegram"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
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

        <p className="text-sm text-secondary">© 2026 Privii. All rights reserved.</p>
      </div>
    </footer>
  );
}
