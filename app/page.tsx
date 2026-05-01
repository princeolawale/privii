import { headers } from "next/headers";
import {
  ArrowRightLeft,
  BriefcaseBusiness,
  Link2,
  Sparkles,
  Tag,
  Users,
  Wallet
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { HeroActions } from "@/components/home/hero-actions";
import { PageShell } from "@/components/layout/page-shell";
import { PublicRouteResolver } from "@/components/public/public-route-resolver";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractTagFromHost } from "@/lib/host";

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
    <PageShell>
      <section className="flex min-h-[68vh] flex-col items-center justify-center pb-20 pt-2 text-center sm:pt-4">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-accent">
            Tags and PayLinks
          </div>
          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Crypto payments made simple
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-secondary sm:text-lg">
              Create a tag. Share a link. Get paid in seconds.
            </p>
          </div>
          <HeroActions />
        </div>
      </section>

      <section className="mx-auto mb-20 flex max-w-5xl flex-col gap-4" id="how-it-works">
        <FeatureCard
          icon={<Tag className="h-5 w-5" />}
          title="Tags"
          text="Create a permanent payment identity anyone can use to pay you."
        />
        <FeatureCard
          icon={<Link2 className="h-5 w-5" />}
          title="PayLinks"
          text="Generate fixed or flexible payment requests in seconds."
        />
        <FeatureCard
          icon={<Wallet className="h-5 w-5" />}
          title="Direct Wallet Payments"
          text="Receive crypto directly into your wallet with no friction."
        />
      </section>

      <section className="mx-auto mb-20 max-w-3xl text-center">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">What is Privii?</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple payments for crypto users
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            Privii is a simple crypto payment layer that lets you receive payments using
            tags and links instead of sharing wallet addresses.
          </p>
        </div>
      </section>

      <section className="mx-auto mb-20 grid max-w-6xl gap-4 lg:grid-cols-3">
        <ValueCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Built for Simplicity"
          text="No complicated setup. Just create a tag and start receiving payments instantly."
        />
        <ValueCard
          icon={<ArrowRightLeft className="h-5 w-5" />}
          title="Faster Payments"
          text="Share a link or tag and get paid in seconds."
        />
        <ValueCard
          icon={<Wallet className="h-5 w-5" />}
          title="Flexible Payments"
          text="Accept fixed payments or let users send any amount."
        />
      </section>

      <section className="mx-auto mb-20 max-w-5xl">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Use Cases</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for Web3 users
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <UseCaseCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Creators"
            text="Get paid directly from your audience"
          />
          <UseCaseCard
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="Freelancers"
            text="Receive payments without sending wallet addresses"
          />
          <UseCaseCard
            icon={<Users className="h-5 w-5" />}
            title="Communities"
            text="Collect payments easily with a shared link"
          />
          <UseCaseCard
            icon={<ArrowRightLeft className="h-5 w-5" />}
            title="Traders"
            text="Accept fast peer-to-peer payments"
          />
        </div>
      </section>

      <section className="mx-auto mb-24 max-w-4xl">
        <Card className="rounded-[36px] px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Start Now</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Start receiving crypto with Privii
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-7 text-secondary sm:text-lg">
              Create your tag or generate a PayLink in seconds.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/get-started">
              <Button className="w-full min-w-[200px] sm:w-auto">Get Started</Button>
            </Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function FeatureCard({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[32px] p-6 sm:p-7">
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          {icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-primary">{title}</h2>
          <p className="max-w-xl text-sm leading-6 text-secondary sm:text-base">{text}</p>
        </div>
      </div>
    </Card>
  );
}

function ValueCard({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[32px] p-6 sm:p-7">
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          {icon}
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold tracking-tight text-primary">{title}</h3>
          <p className="text-sm leading-6 text-secondary sm:text-base">{text}</p>
        </div>
      </div>
    </Card>
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
    <div className="rounded-[28px] border border-border bg-card/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="space-y-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-primary">{title}</h3>
          <p className="text-sm leading-6 text-secondary">{text}</p>
        </div>
      </div>
    </div>
  );
}
