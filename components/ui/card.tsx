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
        "rounded-[30px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(17,17,20,0.96)_0%,rgba(10,10,10,0.98)_100%)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.02)] transition duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
