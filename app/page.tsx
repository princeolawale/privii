import { headers } from "next/headers";

import { HeroActions } from "@/components/home/hero-actions";
import { PageShell } from "@/components/layout/page-shell";
import { PublicRouteResolver } from "@/components/public/public-route-resolver";
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

      <section className="mx-auto mb-10 max-w-5xl text-center" id="how-it-works">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">How It Works</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps to get paid
          </h2>
        </div>
      </section>

      <section className="mx-auto mb-20 grid max-w-5xl gap-4 md:grid-cols-3">
        <StepCard
          step="1"
          title="Create your Privii tag"
          copy="Set the payment identity people can remember."
        />
        <StepCard
          step="2"
          title="Share your tag or PayLink"
          copy="Use a tag for always-on payments or a link for one request."
        />
        <StepCard
          step="3"
          title="Receive crypto instantly"
          copy="Let anyone pay you in a few quick taps."
        />
      </section>

      <section className="mx-auto mb-20 grid max-w-5xl gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Tags + PayLinks</p>
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-medium text-primary">Tags are permanent</h3>
              <p className="mt-1 text-sm text-secondary">
                Use your tag as your always-on payment identity.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-primary">PayLinks are flexible</h3>
              <p className="mt-1 text-sm text-secondary">
                Create fixed or temporary requests when you need them.
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Built For Web3 Users</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniCard title="Creators" copy="Share payment handles anywhere." />
            <MiniCard title="Freelancers" copy="Send clean payment requests fast." />
            <MiniCard title="Communities" copy="Collect treasury payments with links." />
            <MiniCard title="Traders" copy="Move fast with simple payment routing." />
          </div>
        </Card>
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

function MiniCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[22px] border border-border bg-background/60 p-4 text-left">
      <h3 className="text-lg font-medium text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-secondary">{copy}</p>
    </div>
  );
}
