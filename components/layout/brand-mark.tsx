import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  href = "/",
  className
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-3 text-primary", className)}
    >
      <Image
        src="/clinks-logo.png"
        alt="Clinks"
        width={236}
        height={52}
        className="h-auto w-[136px] sm:w-[164px]"
        priority
      />
    </Link>
  );
}
