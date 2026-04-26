"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { PayLinkPaymentClient } from "@/components/pay/paylink-payment-client";
import { Card } from "@/components/ui/card";
import { normalizePriviiTag } from "@/lib/utils";

type State =
  | { kind: "loading" }
  | { kind: "tag" }
  | { kind: "paylink" }
  | { kind: "missing" };

export function PublicRouteResolver({ tag }: { tag: string }) {
  const normalizedTag = normalizePriviiTag(tag);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setState({ kind: "loading" });

      const tagResponse = await fetch(`/api/tags/${normalizedTag}`, {
        cache: "no-store"
      });

      if (tagResponse.ok) {
        if (!cancelled) {
          setState({ kind: "tag" });
        }
        return;
      }

      const payLinkResponse = await fetch(`/api/links/${normalizedTag}`, {
        cache: "no-store"
      });

      if (cancelled) {
        return;
      }

      if (payLinkResponse.ok) {
        setState({ kind: "paylink" });
      } else {
        setState({ kind: "missing" });
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [normalizedTag]);

  if (state.kind === "loading") {
    return (
      <Card className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 text-secondary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading Privii
        </div>
      </Card>
    );
  }

  if (state.kind === "missing") {
    return (
      <Card className="mx-auto max-w-xl space-y-3 rounded-[32px] p-7">
        <h1 className="text-2xl font-semibold tracking-tight">Privii tag not found</h1>
        <p className="text-sm leading-6 text-secondary">
          This tag does not exist yet. Use Get Started to register your own Privii tag,
          or open a one-time PayLink directly for testing.
        </p>
      </Card>
    );
  }

  if (state.kind === "paylink") {
    return <PayLinkPaymentClient tag={normalizedTag} kind="paylink" />;
  }

  return <PayLinkPaymentClient tag={normalizedTag} kind="tag" />;
}
