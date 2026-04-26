import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
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
        src="/icon.png"
        alt="Privii"
        width={30}
        height={30}
        className="rounded-full"
      />
      <span className="text-[2rem] font-semibold tracking-tight sm:text-[2rem]">
        {APP_NAME}
      </span>
    </Link>
  );
}
