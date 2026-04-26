import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BrandMark({
  href = "/",
  size = "default",
  className
}: {
  href?: string;
  size?: "default" | "footer";
  className?: string;
}) {
  const iconSize = size === "footer" ? 34 : 30;
  const textClass = size === "footer" ? "text-3xl" : "text-[2rem] sm:text-[2rem]";

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-3 text-primary", className)}
    >
      <Image
        src="/icon.png"
        alt="Privii"
        width={iconSize}
        height={iconSize}
        className="rounded-full"
      />
      <span className={cn("font-semibold tracking-tight", textClass)}>{APP_NAME}</span>
    </Link>
  );
}
