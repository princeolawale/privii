import Link from "next/link";
import { Send } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";

export function SiteFooter({ marketing = false }: { marketing?: boolean }) {
  return (
    <footer className="mt-20 border-t border-white/[0.06] pt-10">
      <div className="mx-auto grid max-w-6xl gap-10 pb-8 lg:grid-cols-[1.2fr_repeat(3,1fr)_0.9fr]">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-xs text-sm leading-6 text-secondary">
            One identity. Any chain.
          </p>
          <p className="text-sm text-secondary">© 2026 Clinks. All rights reserved.</p>
        </div>

        <FooterColumn
          title="Product"
          links={[
            { href: "/#features", label: "Features" },
            { href: "/#use-cases", label: "Use Cases" }
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { href: "/about", label: "About" }
          ]}
        />
        <FooterColumn
          title="Resources"
          links={[
            { href: "/about#docs", label: "Docs" },
            { href: "/about#guides", label: "Guides" },
            { href: "/about#status", label: "Status" }
          ]}
        />

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-primary">Follow us</h3>
          <div className="flex items-center gap-3">
            <a
              href="https://x.com/clinksdotone?s=21"
              target="_blank"
              rel="noreferrer"
              aria-label="Clinks on X"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-primary transition hover:border-accent/25 hover:bg-accent/10"
            >
              <span className="text-base font-medium">X</span>
            </a>
            <a
              href="https://t.me/clinksdotone"
              target="_blank"
              rel="noreferrer"
              aria-label="Clinks on Telegram"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-primary transition hover:border-mint/25 hover:bg-mint/10"
            >
              <Send className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-primary">{title}</h3>
      <div className="space-y-3">
        {links.map((link) => (
          <Link
            key={`${title}-${link.label}`}
            href={link.href}
            className="block text-sm text-secondary transition hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
