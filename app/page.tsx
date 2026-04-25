import Link from "next/link";
import { ArrowRight, Link2, Shield, Zap } from "lucide-react";

import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";

const features = [
  {
    icon: Link2,
    title: "Shareable payment links",
    copy: "Create a clean `/pay/[slug]` page for one-off or reusable crypto payments."
  },
  {
    icon: Shield,
    title: "Wallet hidden in UI",
    copy: "Keep the recipient address out of the public interface while still sending funds on-chain."
  },
  {
    icon: Zap,
    title: "Built for fast checkout",
    copy: "Let payers connect a wallet, confirm the amount, and send SOL or USDC in one flow."
  }
];

export default function HomePage() {
  return (
    <PageShell className="flex flex-col justify-center">
      <section className="grid items-center gap-10 pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-accent">
            Premium crypto payments
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
              Crypto payment links that feel as polished as the rest of your brand.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-secondary sm:text-lg">
              PayLinks lets creators, operators, and teams collect SOL or USDC through a
              simple public link while keeping the destination wallet off the UI.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/create">
              <Button className="w-full sm:w-auto">
                Create PayLink
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <ConnectWalletButton />
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-6">
            <p className="text-sm text-secondary">Preview</p>
            <p className="mt-2 text-2xl font-semibold">paylinks.app/pay/studio</p>
          </div>
          <div className="space-y-5 p-6">
            <div className="rounded-3xl border border-border bg-background/70 p-5">
              <p className="text-sm text-secondary">Amount</p>
              <p className="mt-3 text-4xl font-semibold">25 USDC</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Token" value="USDC" />
              <Stat label="Type" value="Permanent" />
              <Stat label="Status" value="Active" />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="space-y-4">
            <feature.icon className="h-5 w-5 text-accent" />
            <div className="space-y-2">
              <h2 className="text-lg font-medium">{feature.title}</h2>
              <p className="text-sm leading-6 text-secondary">{feature.copy}</p>
            </div>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{label}</p>
      <p className="mt-2 text-sm font-medium text-primary">{value}</p>
    </div>
  );
}
