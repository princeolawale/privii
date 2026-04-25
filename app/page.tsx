import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { PublicRouteResolver } from "@/components/public/public-route-resolver";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractTagFromHost } from "@/lib/utils";

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
      <section className="flex min-h-[68vh] flex-col items-center justify-center pb-20 pt-8 text-center">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-accent">
            Private crypto payment tags
          </div>
          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Get paid privately with your Privii tag
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-secondary sm:text-lg">
              Register your tag. Share it anywhere. Receive crypto without exposing
              your wallet in the UI.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/get-started">
              <Button className="w-full min-w-[200px] sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" className="w-full min-w-[200px] sm:w-auto">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 grid max-w-5xl gap-4 md:grid-cols-3" id="how-it-works">
        <StepCard
          step="1"
          title="Register your Privii tag"
          copy="Claim the payment identity you want people to remember."
        />
        <StepCard
          step="2"
          title="Share your payment identity"
          copy="Drop your tag into socials, chat, or anywhere people pay you."
        />
        <StepCard
          step="3"
          title="Receive crypto through Privii"
          copy="Accept SOL or USDC while keeping your wallet hidden in the UI."
        />
      </section>
    </PageShell>
  );
}

function StepCard({
  step,
  title,
  copy
}: {
  step: string;
  title: string;
  copy: string;
}) {
  return (
    <Card className="space-y-4 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm font-semibold text-accent">
        {step}
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-medium text-primary">{title}</h2>
        <p className="text-sm leading-6 text-secondary">{copy}</p>
      </div>
    </Card>
  );
}
