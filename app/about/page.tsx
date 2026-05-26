import {
  ArrowRight,
  Blocks,
  Globe2,
  Link2,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

const supportedChains = [
  "Ethereum",
  "Solana",
  "Base",
  "Polygon",
  "BNB Chain",
  "Arbitrum"
] as const;

export default function AboutPage() {
  return (
    <PageShell marketing>
      <section className="relative isolate overflow-hidden pt-8 sm:pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_62%_12%,rgba(139,92,255,0.14),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.01),transparent_38%)]" />
        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <div className="inline-flex rounded-full bg-white/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.18)]">
            About Clinks
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            One payment identity for the entire on-chain economy.
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-8 text-secondary sm:text-lg">
            Clinks gives individuals, teams, and products one human-readable identity for receiving
            crypto across chains. Instead of sharing multiple wallet addresses, you share one
            username or one payment link and let Clinks route the payment correctly.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-5 lg:grid-cols-3">
        <InfoCard
          icon={<Link2 className="h-5 w-5" />}
          title="Universal receive identity"
          text="A Clinks ID becomes a permanent payment destination that can work across multiple chains and wallets."
        />
        <InfoCard
          icon={<WalletCards className="h-5 w-5" />}
          title="Wallet abstraction"
          text="Clinks separates the public receive experience from the underlying wallet setup, so people pay a name, not an address list."
        />
        <InfoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Non-custodial by design"
          text="Payments still settle directly to the configured receiver wallets. Clinks does not take custody of user funds."
        />
      </section>

      <section id="docs" className="mx-auto mt-24 max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Docs</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How Clinks works under the hood.
            </h2>
            <p className="text-base leading-8 text-secondary">
              Clinks is built as a payment identity layer. A user registers a single tag, links
              supported wallets, and uses that tag as the public receive surface for direct
              blockchain payments and payment links.
            </p>
          </div>

          <div className="grid gap-4">
            <DocCard
              title="1. Create your ID"
              text="A user claims a unique Clinks tag such as chido.clinks. That tag becomes the public receive identity."
            />
            <DocCard
              title="2. Link receiving wallets"
              text="The same tag can be connected to a Solana wallet and an EVM wallet. Clinks keeps each linked wallet tied to the same public identity."
            />
            <DocCard
              title="3. Route by network"
              text="When a payer selects Solana, Clinks resolves the Solana receiving wallet. When a payer selects an EVM chain, Clinks resolves the linked EVM wallet."
            />
            <DocCard
              title="4. Confirm on-chain"
              text="Payment history is only recorded after confirmed blockchain settlement. Opening a link alone does not create fake activity."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Supported networks</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for multi-chain receiving from day one.
          </h2>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {supportedChains.map((chain) => (
            <div
              key={chain}
              className="inline-flex items-center rounded-full bg-white/[0.03] px-4 py-2.5 text-sm text-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
            >
              {chain}
            </div>
          ))}
        </div>
      </section>

      <section id="guides" className="mx-auto mt-24 max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-2">
          <GuideCard
            icon={<Blocks className="h-5 w-5" />}
            title="For teams and products"
            text="Use Clinks as a simple receive layer for marketplaces, creator products, community payments, and cross-chain checkout flows."
          />
          <GuideCard
            icon={<Globe2 className="h-5 w-5" />}
            title="For global recipients"
            text="Give clients, communities, or audiences one identity to pay, without asking them to understand your wallet stack first."
          />
        </div>
      </section>

      <section id="status" className="mx-auto mt-24 max-w-6xl">
        <Card className="rounded-[32px] border-white/[0.05] bg-card px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.48)] sm:px-8 sm:py-9">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Status</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Current product scope.
              </h2>
              <p className="text-base leading-8 text-secondary">
                Clinks currently focuses on universal crypto receive identities, multi-wallet
                routing, direct payment flows, and payment links. The product remains
                non-custodial, with payments settling directly to linked receiver wallets.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Universal receive tags",
                "Multi-chain wallet resolution",
                "Direct payment links",
                "Confirmed-only transaction history"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] bg-white/[0.03] px-4 py-3 text-sm text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto mt-24 max-w-5xl">
        <Card className="rounded-[36px] border-white/[0.05] bg-card px-6 py-9 shadow-[0_28px_90px_rgba(0,0,0,0.5)] sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Create your Clinks ID.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-secondary">
                Start with one name. Receive across chains.
              </p>
            </div>

            <Link href="/get-started">
              <button className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_62%,#7043FF_100%)] px-6 text-base font-medium text-white shadow-[0_16px_40px_rgba(91,45,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(91,45,255,0.3)]">
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

function InfoCard({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] bg-card p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="space-y-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.14)]">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <p className="text-sm leading-7 text-secondary">{text}</p>
        </div>
      </div>
    </div>
  );
}

function DocCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[26px] bg-card p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-secondary">{text}</p>
    </div>
  );
}

function GuideCard({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] bg-card p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="space-y-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(139,92,255,0.14)]">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <p className="text-sm leading-7 text-secondary">{text}</p>
        </div>
      </div>
    </div>
  );
}
