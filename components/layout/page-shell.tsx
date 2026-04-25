import type { PropsWithChildren } from "react";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className="min-h-screen bg-background bg-accent-radial text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-secondary">
            <Link className="transition hover:text-primary" href="/create">
              Create
            </Link>
          </nav>
        </header>
        <main className={cn("flex-1", className)}>{children}</main>
      </div>
    </div>
  );
}
