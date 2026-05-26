import { headers } from "next/headers";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ReceiptText,
  Send,
  Sparkles,
  UsersRound,
  WalletCards
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { PublicRouteResolver } from "@/components/public/public-route-resolver";
import { Card } from "@/components/ui/card";
import { extractTagFromHost } from "@/lib/host";

const chainStrip = [
  { label: "Ethereum", icon: <EthereumMark /> },
  { label: "Solana", icon: <SolanaMark /> },
  { label: "Base", icon: <BaseMark /> },
  { label: "Polygon", icon: <PolygonMark /> },
  { label: "BNB Chain", icon: <BnbMark /> },
  { label: "Arbitrum", icon: <ArbitrumMark /> }
] as const;

export default async function HomePage() {
  const requestHeaders = await headers();
  const hostTag = extractTagFromHost(requestHeaders.get("host"));

  if (hostTag) {
    return (
      <PageShell className="flex items-start pt-6 sm:pt-10" largeLogo>
        <PublicRouteResolver tag={hostTag} />
      </PageShell>
    );
  }

  return (
    <PageShell marketing>
      <section className="relative isolate overflow-hidden pt-6 sm:pt-8 lg:pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_74%_18%,rgba(139,92,255,0.16),transparent_20%),radial-gradient(circle_at_70%_28%,rgba(0,163,255,0.06),transparent_16%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_40%)]" />
        <div className="grid gap-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <div className="relative z-10 max-w-2xl space-y-9 pt-4 sm:pt-8 lg:pt-14">
            <div className="inline-flex rounded-full bg-white/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.18)]">
              One identity. Multi-chain.
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                The universal payment identity for crypto.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-secondary sm:text-xl">
                Receive payments across chains using one username or link.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <Link href="/get-started">
                <button className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_62%,#7043FF_100%)] px-6 text-base font-medium text-white shadow-[0_16px_40px_rgba(91,45,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(91,45,255,0.3)]">
                  Create Clinks ID
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-secondary">Trusted by people building on</p>
              <div className="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-3 text-sm text-secondary sm:flex sm:flex-wrap sm:items-center sm:gap-5">
                {chainStrip.slice(0, 5).map((chain) => (
                  <span key={chain.label} className="inline-flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center">
                      {chain.icon}
                    </span>
                    {chain.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="mx-auto max-w-[560px]">
              <div className="pointer-events-none absolute inset-x-20 bottom-8 h-24 rounded-full bg-[radial-gradient(circle,rgba(91,45,255,0.2),transparent_64%)] blur-2xl" />
              <Image
                src="/home-hero-clinks.jpg"
                alt="Clinks hero preview showing yourname.clinks across multiple chains"
                width={1280}
                height={1280}
                className="h-auto w-full object-cover opacity-96 [mask-image:radial-gradient(circle_at_center,black_68%,transparent_100%)]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-[24px] bg-white/[0.022] px-5 py-4 text-sm text-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)] sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-secondary">
            Supported chains
          </span>
          {chainStrip.map((chain) => (
            <span key={chain.label} className="inline-flex items-center gap-2.5 whitespace-nowrap">
              <span className="flex h-5 w-5 items-center justify-center">{chain.icon}</span>
              {chain.label}
            </span>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto mt-28 max-w-6xl">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">How Clinks Works</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Three clean steps to get paid on-chain.
          </h2>
          <p className="text-base leading-7 text-secondary">
            Set up one identity, link your wallets, and use it everywhere you receive.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <StepCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Create your ID"
            text="Claim a username that becomes your universal payment identity."
          />
          <StepConnector />
          <StepCard
            icon={<WalletCards className="h-5 w-5" />}
            title="Link wallets"
            text="Connect the wallets you want to receive with, without changing your public link."
          />
          <StepConnector />
          <StepCard
            icon={<Send className="h-5 w-5" />}
            title="Receive payments"
            text="Share one username or link and accept funds across supported chains."
          />
        </div>
      </section>

      <section id="use-cases" className="mx-auto mt-28 max-w-6xl">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Use Cases</p>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for operators, creators, and teams receiving on-chain.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UseCaseCard
            icon={<Sparkles className="h-4 w-4" />}
            title="Creators"
            text="Get paid from your audience without sharing multiple wallet addresses."
          />
          <UseCaseCard
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            title="Freelancers"
            text="Invoice clients with one identity that works across chains."
          />
          <UseCaseCard
            icon={<UsersRound className="h-4 w-4" />}
            title="Communities"
            text="Collect dues, treasury contributions, and event payments from one link."
          />
          <UseCaseCard
            icon={<ReceiptText className="h-4 w-4" />}
            title="Teams"
            text="Standardize inbound on-chain payments across products and markets."
          />
        </div>
      </section>

      <section
        id="product"
        className="mx-auto mt-32 grid max-w-6xl gap-14 lg:grid-cols-[0.84fr_1.16fr] lg:items-center"
      >
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Product</p>
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything you need to receive, in one place.
            </h2>
            <p className="max-w-lg text-base leading-7 text-secondary">
              A single payment identity for links, wallets, routing, and activity across the chains your users already use.
            </p>
          </div>

          <div className="space-y-4">
            <FeatureBullet>One link for multi-chain payments</FeatureBullet>
            <FeatureBullet>Multi-wallet receiving</FeatureBullet>
            <FeatureBullet>Real-time payment activity</FeatureBullet>
            <FeatureBullet>Non-custodial by design</FeatureBullet>
          </div>

          <div
            id="docs"
            className="rounded-[26px] bg-white/[0.025] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
          >
            <p className="text-sm leading-7 text-secondary">
              Documentation, guides, and reference material for integrating Clinks into production payment flows.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="mx-auto max-w-[620px]">
            <div className="pointer-events-none absolute inset-x-16 bottom-8 h-24 rounded-full bg-[radial-gradient(circle,rgba(91,45,255,0.18),transparent_64%)] blur-2xl" />
            <Image
              src="/home-product-clinks.jpg"
              alt="Clinks product showcase with global crypto payment activity"
              width={1280}
              height={1280}
              className="h-auto w-full object-cover opacity-96 [mask-image:radial-gradient(circle_at_center,black_72%,transparent_100%)]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-5xl">
        <Card className="rounded-[36px] border-white/[0.05] bg-[#0A0A0F] px-6 py-9 shadow-[0_28px_90px_rgba(0,0,0,0.5)] sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 text-left">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to simplify crypto payments?
              </h2>
              <p className="max-w-2xl text-base leading-7 text-secondary">
                Create your Clinks ID and start receiving across chains.
              </p>
            </div>

            <Link href="/get-started">
              <button className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_62%,#7043FF_100%)] px-6 text-base font-medium text-white shadow-[0_16px_40px_rgba(91,45,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(91,45,255,0.3)]">
                Create Clinks ID
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function EthereumMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <path d="M16 2 8.4 16 16 12.1 23.6 16 16 2Z" fill="#D9D9D9" />
      <path d="M16 29.6 8.4 17.5 16 21.9l7.6-4.4L16 29.6Z" fill="#B5B5B5" />
      <path d="M16 20.4 8.4 16 16 12.1V20.4Z" fill="#A0A0A0" />
      <path d="M16 12.1 23.6 16 16 20.4V12.1Z" fill="#F2F2F2" />
    </svg>
  );
}

function SolanaMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <defs>
        <linearGradient id="solana-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="52%" stopColor="#8B5CFF" />
          <stop offset="100%" stopColor="#00A3FF" />
        </linearGradient>
      </defs>
      <path d="M8 7.5A2 2 0 0 1 10 6h13.7a1 1 0 0 1 .7 1.7l-3.3 3.4a2 2 0 0 1-1.4.6H6a1 1 0 0 1-.7-1.7L8 7.5Z" fill="url(#solana-gradient)" />
      <path d="M8 20.5A2 2 0 0 1 10 19h13.7a1 1 0 0 1 .7 1.7l-3.3 3.4a2 2 0 0 1-1.4.6H6a1 1 0 0 1-.7-1.7L8 20.5Z" fill="url(#solana-gradient)" />
      <path d="M24 13.5A2 2 0 0 0 22 12H8.3a1 1 0 0 0-.7 1.7l3.3 3.4a2 2 0 0 0 1.4.6H26a1 1 0 0 0 .7-1.7L24 13.5Z" fill="url(#solana-gradient)" />
    </svg>
  );
}

function BaseMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#ffffff" />
      <rect x="8" y="14.4" width="16" height="3.2" rx="1.6" fill="#0052FF" />
    </svg>
  );
}

function PolygonMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <path
        d="m11.1 10.4 4-2.3a2 2 0 0 1 2 0l4 2.3a2 2 0 0 1 1 1.7v4.6a2 2 0 0 1-1 1.7l-4 2.3a2 2 0 0 1-2 0l-4-2.3a2 2 0 0 1-1-1.7v-4.6a2 2 0 0 1 1-1.7Z"
        fill="none"
        stroke="#8247E5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.3"
      />
      <path
        d="m20.9 11.1 3.3-1.9a2 2 0 0 1 2 0l1.6.9a2 2 0 0 1 1 1.7v3.8a2 2 0 0 1-1 1.7l-3.3 1.9"
        fill="none"
        stroke="#8247E5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.3"
      />
    </svg>
  );
}

function BnbMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <path
        d="m16 4 3.1 3.1-3.1 3.1-3.1-3.1L16 4Zm6.2 6.2 3.1 3.1-3.1 3.1-3.1-3.1 3.1-3.1ZM9.8 10.2l3.1 3.1-3.1 3.1-3.1-3.1 3.1-3.1ZM16 12.4l3.6 3.6-3.6 3.6-3.6-3.6 3.6-3.6Zm-6.2 6.2 3.1 3.1-3.1 3.1-3.1-3.1 3.1-3.1Zm12.4 0 3.1 3.1-3.1 3.1-3.1-3.1 3.1-3.1Z"
        fill="#F3BA2F"
      />
    </svg>
  );
}

function ArbitrumMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <path
        d="M16 3.5 26.4 9.5v13L16 28.5 5.6 22.5v-13L16 3.5Z"
        fill="#1F2430"
        stroke="#A4B1CC"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="m18.7 9.2 4.8 13.6-2.8 1.6-4.8-13.6 2.8-1.6Z" fill="#28A0F0" />
      <path d="m13.3 10.5 4.8 13.6-2.7 1.5-4.8-13.5 2.7-1.6Z" fill="#ffffff" />
      <path d="m21.1 8 4.3 2.4v11.2l-1.6.9L19 9.2 21.1 8Z" fill="#96BEDC" />
    </svg>
  );
}

function StepCard({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] bg-white/[0.02] p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.14)]">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-primary">{title}</h3>
          <p className="max-w-sm text-sm leading-7 text-secondary">{text}</p>
        </div>
      </div>
    </div>
  );
}

function StepConnector() {
  return (
    <div className="hidden lg:flex lg:items-center lg:justify-center">
      <ArrowRight className="h-5 w-5 text-secondary/60" />
    </div>
  );
}

function FeatureBullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-base text-primary">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.14)]">
        <Check className="h-3.5 w-3.5" />
      </div>
      <span>{children}</span>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] bg-white/[0.02] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.14)]">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <p className="text-sm leading-6 text-secondary">{text}</p>
        </div>
      </div>
    </div>
  );
}
