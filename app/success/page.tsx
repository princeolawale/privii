import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ tx?: string; tag?: string }>;
}) {
  const { tx, tag } = await searchParams;
  const explorerUrl = tx
    ? `https://solscan.io/tx/${encodeURIComponent(tx)}`
    : null;

  return (
    <PageShell className="flex items-center justify-center">
      <Card className="mx-auto max-w-xl space-y-6 p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <CheckCircle2 className="h-7 w-7 text-accent" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Payment complete</h1>
          <p className="text-sm leading-6 text-secondary">
            The transaction has been submitted to Solana. You can reopen the Privii link
            or inspect the transaction hash below.
          </p>
        </div>

        {tx ? (
          <div className="rounded-2xl border border-border bg-background/70 p-4 text-left text-sm text-secondary">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-secondary">Transaction</p>
            <p className="break-all text-primary">{tx}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {tag ? (
            <Link href={`/${tag}`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                View PayLink
              </Button>
            </Link>
          ) : null}

          {explorerUrl ? (
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              <Button className="w-full sm:w-auto">
                Open explorer
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          ) : null}
        </div>
      </Card>
    </PageShell>
  );
}
