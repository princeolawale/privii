"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { PayLinkPaymentClient } from "@/components/pay/paylink-payment-client";
import { TagProfileClient } from "@/components/public/tag-profile-client";
import { Card } from "@/components/ui/card";
import type { PriviiTagRecord } from "@/lib/types";
import { normalizePriviiTag } from "@/lib/utils";

type RouteState =
  | { kind: "loading" }
  | { kind: "tag"; record: PriviiTagRecord }
  | { kind: "paylink" }
  | { kind: "missing" };

export function PublicRouteResolver({ tag }: { tag: string }) {
  const normalizedTag = normalizePriviiTag(tag);
  const [state, setState] = useState<RouteState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveRoute() {
      setState({ kind: "loading" });

      const tagResponse = await fetch(`/api/tags/${normalizedTag}`, {
        cache: "no-store"
      });

      if (tagResponse.ok) {
        const result = (await tagResponse.json()) as { tag: PriviiTagRecord };

        if (!cancelled) {
          setState({ kind: "tag", record: result.tag });
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
        return;
      }

      setState({ kind: "missing" });
    }

    resolveRoute();

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
      <Card className="mx-auto max-w-xl rounded-[32px] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Privii tag not found.</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          This tag does not exist yet. Register your own Privii tag to start receiving
          crypto with a cleaner public identity.
        </p>
      </Card>
    );
  }

  if (state.kind === "paylink") {
    return <PayLinkPaymentClient tag={normalizedTag} />;
  }

  return <TagProfileClient record={state.record} />;
}
