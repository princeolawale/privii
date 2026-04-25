import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { V2Shell } from "@/components/v2/v2-shell";
import { Button } from "@/components/ui/button";

export default function V2HomePage() {
  return (
    <V2Shell>
      <section className="grid min-h-[72vh] items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-accent">
            Frontend experiment
          </span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-6xl font-semibold tracking-[-0.08em] text-primary sm:text-7xl">
              A second Privii frontend on the same backend.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-secondary">
              This `v2` surface reuses the working create, fetch, KV, wallet, and payment
              flow while giving us a separate UI to test before switching over.
            </p>
          </div>
          <Link href="/v2/create">
            <Button className="h-14 rounded-full px-7 text-lg">
              Start testing v2
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          <PreviewCard title="Create" copy="Uses the same `/api/links/create` route and writes to the same KV store." />
          <PreviewCard title="Pay" copy="Uses the same Solana adapter and transaction logic as the current app." />
          <PreviewCard title="Switch later" copy="Once approved, we can promote these pages into the main surface with minimal backend risk." />
        </div>
      </section>
    </V2Shell>
  );
}

function PreviewCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
      <p className="mb-2 text-xl font-medium text-primary">{title}</p>
      <p className="text-secondary">{copy}</p>
    </div>
  );
}
