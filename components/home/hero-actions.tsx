"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useOwnerTag } from "@/components/solana/use-owner-tag";
import { Button } from "@/components/ui/button";

export function HeroActions() {
  const { hasTag } = useOwnerTag();

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Link href={hasTag ? "/dashboard" : "/get-started"}>
        <Button className="w-full min-w-[200px] sm:w-auto">
          {hasTag ? "Dashboard" : "Get Started"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
      <Link href="/create">
        <Button variant="secondary" className="w-full min-w-[200px] sm:w-auto">
          Create PayLink
        </Button>
      </Link>
    </div>
  );
}
