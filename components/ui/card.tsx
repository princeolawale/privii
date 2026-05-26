import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "rounded-[30px] border border-white/[0.04] bg-card p-6 shadow-[0_28px_96px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.018)] transition duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
