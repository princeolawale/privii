import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <PageShell>
      <section className="flex min-h-[68vh] flex-col items-center justify-center pb-20 pt-8 text-center">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-accent">
            Private crypto payments
          </div>
          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Get paid in crypto with a simple link
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-secondary sm:text-lg">
              Create a PayLink. Share it. Get paid instantly.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/create">
              <Button className="w-full min-w-[200px] sm:w-auto">
                Create PayLink
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 grid max-w-5xl gap-4 md:grid-cols-3" id="how-it-works">
        <StepCard
          step="1"
          title="Create your PayLink"
          copy="Choose your Privii tag, token, and amount in a few taps."
        />
        <StepCard
          step="2"
          title="Share it anywhere"
          copy="Send your private payment link on socials, chat, or email."
        />
        <StepCard
          step="3"
          title="Receive crypto privately"
          copy="Get paid on Solana without exposing your wallet in the UI."
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
