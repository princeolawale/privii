import { Send } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/80 pt-10">
      <div className="flex flex-col items-center justify-center gap-6 pb-4 text-center">
        <p className="text-sm text-secondary">2026 Privii. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Privii on X"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-secondary transition hover:border-white/20 hover:text-primary"
          >
            <span className="text-2xl font-medium text-primary">X</span>
          </a>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            aria-label="Privii on Telegram"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-secondary transition hover:border-white/20 hover:text-primary"
          >
            <Send className="h-6 w-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}
