import { headers } from "next/headers";
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  Code2,
  Copy,
  Link2,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { PublicRouteResolver } from "@/components/public/public-route-resolver";
import { Card } from "@/components/ui/card";
import { extractTagFromHost } from "@/lib/host";

const supportedChains = [
  "Ethereum",
  "Solana",
  "Base",
  "Polygon",
  "BNB Chain",
  "Arbitrum",
  "And more"
] as const;

const recentPayments = [
  { asset: "USDC", chain: "Base", amount: "+250.00 USDC" },
  { asset: "USDT", chain: "Polygon", amount: "+150.00 USDT" },
  { asset: "SOL", chain: "Solana", amount: "+0.85 SOL" },
  { asset: "DAI", chain: "Ethereum", amount: "+500.00 DAI" }
] as const;

const connectedWallets = [
  { label: "Ethereum", address: "0x27...E792" },
  { label: "Solana", address: "4wGh...9Qy2" },
  { label: "Base", address: "0x27...E792" }
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
      <section className="relative isolate overflow-hidden pt-4 sm:pt-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_62%_22%,rgba(139,92,255,0.14),transparent_24%),radial-gradient(circle_at_74%_30%,rgba(0,163,255,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_40%)]" />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
          <div className="relative z-10 max-w-2xl space-y-8 pt-6 sm:pt-10 lg:pt-14">
            <div className="inline-flex rounded-full border border-accent/25 bg-accent/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-accent">
              One identity. Any chain.
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                The universal payment identity for crypto.
              </h1>
              <p className="max-w-xl text-base leading-7 text-secondary sm:text-lg">
                Receive payments from any blockchain using a single link or username.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <Link href="/get-started">
                <button className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_55%,#7C4DFF_100%)] px-6 text-base font-medium text-white shadow-[0_18px_40px_rgba(91,45,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(91,45,255,0.28)]">
                  Create your Clinks ID
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
              <Link href="/#how-it-works">
                <button className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-border bg-card px-6 text-base font-medium text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-accent/25 hover:bg-accent/8">
                  See how it works
                </button>
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              <p className="text-sm text-secondary">Built for teams and individuals receiving on-chain.</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
                {supportedChains.slice(0, 5).map((chain) => (
                  <span
                    key={chain}
                    className="inline-flex items-center rounded-full border border-border bg-card/70 px-3 py-2"
                  >
                    {chain}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <Card className="rounded-[32px] border-white/8 bg-[#0B0B12] p-4 shadow-[0_20px_100px_rgba(0,0,0,0.48),0_0_0_1px_rgba(139,92,255,0.08)] sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div className="rounded-[24px] border border-white/6 bg-black/30 p-4">
                  <div className="mb-6 flex items-center gap-2 text-sm font-medium text-primary">
                    <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                    clinks
                  </div>
                  <div className="space-y-2">
                    {["Overview", "Receive", "Transactions", "Connections", "Settings"].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-2xl px-3 py-2 text-sm ${
                          index === 1
                            ? "bg-accent/12 text-primary shadow-[inset_0_0_0_1px_rgba(139,92,255,0.12)]"
                            : "text-secondary"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-2xl border border-white/6 bg-card/90 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary">Profile</p>
                    <p className="mt-2 text-sm font-medium text-primary">chido.clinks</p>
                    <p className="mt-1 text-xs text-secondary">View profile</p>
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-white/6 bg-card/95 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-secondary">Your Clinks ID</p>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-semibold text-primary sm:text-3xl">
                          chido.clinks
                        </h2>
                        <Copy className="h-4 w-4 text-secondary" />
                      </div>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-black/30 text-secondary">
                      <QrCode className="h-8 w-8" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_170px]">
                    <div className="rounded-2xl border border-white/6 bg-black/25 p-4">
                      <p className="text-sm text-secondary">Share link</p>
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-card px-4 py-3 text-sm text-primary">
                        <span className="truncate">https://clinks.one/chido</span>
                        <span className="text-secondary">Copy</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/6 bg-black/25 p-4">
                      <p className="text-sm text-secondary">Connected wallets</p>
                      <div className="mt-3 space-y-3">
                        {connectedWallets.map((wallet) => (
                          <div key={`${wallet.label}-${wallet.address}`} className="rounded-2xl border border-white/6 bg-card px-3 py-2.5">
                            <p className="text-xs uppercase tracking-[0.18em] text-secondary">{wallet.label}</p>
                            <p className="mt-1 text-sm text-primary">{wallet.address}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/6 bg-black/25 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm text-secondary">Recent received payments</p>
                      <span className="text-xs text-accent">View all</span>
                    </div>
                    <div className="space-y-3">
                      {recentPayments.map((payment) => (
                        <div
                          key={`${payment.asset}-${payment.chain}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-card px-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-primary">{payment.asset}</p>
                            <p className="text-xs text-secondary">{payment.chain}</p>
                          </div>
                          <p className="text-sm font-medium text-mint">{payment.amount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="features" className="mt-10">
        <Card className="rounded-[28px] border-white/8 bg-[#0B0B12] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-secondary">
              Supported chains
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
              {supportedChains.map((chain) => (
                <span key={chain} className="inline-flex items-center rounded-full border border-white/6 bg-card/80 px-3 py-2">
                  {chain}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section id="how-it-works" className="mx-auto mt-20 max-w-6xl">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">How Clinks Works</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Three simple steps to get paid from any chain.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <StepCard
            number="1"
            icon={<Sparkles className="h-5 w-5" />}
            title="Create your ID"
            text="Claim your unique Clinks ID. It becomes your universal payment identity."
          />
          <StepArrow />
          <StepCard
            number="2"
            icon={<WalletCards className="h-5 w-5" />}
            title="Connect wallets"
            text="Connect wallets across the chains you want to receive on."
          />
          <StepArrow />
          <StepCard
            number="3"
            icon={<ArrowRightLeft className="h-5 w-5" />}
            title="Receive payments"
            text="Share your username or link and get paid on any supported chain."
          />
        </div>
      </section>

      <section id="use-cases" className="mx-auto mt-24 max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Use Cases</p>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for the teams moving money on-chain every day.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-secondary sm:text-base">
            From creators to global communities, Clinks gives every recipient one identity to
            receive across chains.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UseCaseCard
            title="Creators"
            text="Collect support, subscriptions, and paid drops with one public profile."
          />
          <UseCaseCard
            title="Freelancers"
            text="Invoice clients with a single payment identity instead of pasting wallet addresses."
          />
          <UseCaseCard
            title="Communities"
            text="Settle treasury contributions, dues, or event payments from one shareable link."
          />
          <UseCaseCard
            title="Teams"
            text="Route payments to the right wallets while keeping the receive experience simple."
          />
        </div>
      </section>

      <section id="product" className="mx-auto mt-24 grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Simple. Powerful.</p>
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything you need to receive, in one place.
            </h2>
          </div>

          <div className="space-y-4">
            <FeatureBullet icon={<Link2 className="h-4 w-4" />}>
              One link for all chains
            </FeatureBullet>
            <FeatureBullet icon={<ReceiptText className="h-4 w-4" />}>
              Real-time transaction tracking
            </FeatureBullet>
            <FeatureBullet icon={<WalletCards className="h-4 w-4" />}>
              Multi-wallet connections
            </FeatureBullet>
            <FeatureBullet icon={<ShieldCheck className="h-4 w-4" />}>
              Secure and non-custodial
            </FeatureBullet>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MiniInfoCard id="docs" title="Docs" text="Reference guides, integration patterns, and launch checklists for shipping faster." icon={<ReceiptText className="h-4 w-4" />} />
            <MiniInfoCard id="about" title="Operations" text="Keep receive flows simple while tracking confirmations and wallet coverage in one place." icon={<Code2 className="h-4 w-4" />} />
          </div>

          <div id="about" className="rounded-[24px] border border-white/6 bg-card/90 p-5">
            <p className="text-sm text-secondary">
              Clinks is built for modern crypto teams, creators, and operators who need a
              cleaner way to receive across chains.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Card className="rounded-[32px] border-white/8 bg-[#0B0B12] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
            <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)]">
              <div className="rounded-[24px] border border-white/6 bg-black/30 p-4">
                <div className="space-y-2">
                  {["Overview", "Receive", "Transactions", "Connections"].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        index === 1
                          ? "bg-accent/12 text-primary shadow-[inset_0_0_0_1px_rgba(139,92,255,0.12)]"
                          : "text-secondary"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-[24px] border border-white/6 bg-card/95 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Receive</p>
                    <h3 className="mt-2 text-2xl font-semibold text-primary">chido.clinks</h3>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-black/30 text-secondary">
                    <QrCode className="h-8 w-8" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/6 bg-black/25 p-4">
                  <p className="text-sm text-secondary">Share your link</p>
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/6 bg-card px-4 py-3 text-sm text-primary">
                    <span>https://clinks.one/chido</span>
                    <Copy className="h-4 w-4 text-secondary" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/6 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary">Auto-detect</p>
                    <p className="mt-2 text-sm text-primary">Accept payments from all linked chains.</p>
                  </div>
                  <div className="rounded-2xl border border-white/6 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary">Tracking</p>
                    <p className="mt-2 text-sm text-primary">Monitor confirmed transactions in real time.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[32px] border-white/8 bg-[#0B0B12] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
            <div className="overflow-hidden rounded-[28px] border border-white/6 bg-black/30 p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-secondary">chido.clinks</p>
                  <h3 className="mt-2 text-3xl font-semibold text-primary">$24,596.24</h3>
                  <p className="mt-1 text-sm text-mint">+12.5%</p>
                </div>

                <div className="h-28 rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(139,92,255,0.14),rgba(0,163,255,0.04))]" />

                <div className="space-y-3">
                  {recentPayments.slice(0, 3).map((payment) => (
                    <div
                      key={`${payment.asset}-${payment.amount}`}
                      className="flex items-center justify-between rounded-2xl border border-white/6 bg-card px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-primary">{payment.asset}</p>
                        <p className="text-xs text-secondary">{payment.chain}</p>
                      </div>
                      <p className="text-sm font-medium text-mint">{payment.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-5xl">
        <Card className="rounded-[36px] border-white/8 bg-[#0B0B12] px-6 py-8 shadow-[0_24px_100px_rgba(0,0,0,0.46)] sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to simplify your crypto payments?
              </h2>
              <p className="max-w-2xl text-base leading-7 text-secondary">
                Create your Clinks ID and start receiving on any chain.
              </p>
            </div>

            <Link href="/get-started">
              <button className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_55%,#7C4DFF_100%)] px-6 text-base font-medium text-white shadow-[0_18px_40px_rgba(91,45,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(91,45,255,0.28)]">
                Create your Clinks ID
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function StepCard({
  number,
  icon,
  title,
  text
}: {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border-white/8 bg-[#0B0B12] p-6">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            {icon}
          </div>
          <span className="inline-flex rounded-full border border-white/8 bg-card/80 px-2.5 py-1 text-xs text-secondary">
            {number}
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-primary">{title}</h3>
          <p className="text-sm leading-6 text-secondary">{text}</p>
        </div>
      </div>
    </Card>
  );
}

function StepArrow() {
  return (
    <div className="hidden lg:flex lg:justify-center">
      <ArrowRight className="h-5 w-5 text-secondary" />
    </div>
  );
}

function FeatureBullet({
  icon,
  children
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-card/90 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
        {icon}
      </div>
      <span className="text-sm text-primary">{children}</span>
    </div>
  );
}

function MiniInfoCard({
  id,
  title,
  text,
  icon
}: {
  id: string;
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <div id={id} className="rounded-[24px] border border-white/6 bg-card/90 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl border border-electric/20 bg-electric/10 text-electric">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-secondary">{text}</p>
    </div>
  );
}

function UseCaseCard({
  title,
  text
}: {
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border-white/8 bg-[#0B0B12] p-6">
      <div className="space-y-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          <Check className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-medium text-primary">{title}</h3>
        <p className="text-sm leading-6 text-secondary">{text}</p>
      </div>
    </Card>
  );
}
