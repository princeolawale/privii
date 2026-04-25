import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-8">
      <div className="flex flex-col gap-8 text-sm text-secondary md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-base font-semibold text-primary">{APP_NAME}</p>
          <p>Private crypto payments via links.</p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex gap-4">
            <Link href="/" className="transition hover:text-primary">
              Home
            </Link>
            <Link href="/create" className="transition hover:text-primary">
              Create
            </Link>
            <Link href="/#how-it-works" className="transition hover:text-primary">
              How it Works
            </Link>
          </div>

          <div className="flex gap-4">
            <a href="https://x.com/" target="_blank" rel="noreferrer" className="transition hover:text-primary">
              X
            </a>
            <a href="https://t.me/" target="_blank" rel="noreferrer" className="transition hover:text-primary">
              Telegram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
