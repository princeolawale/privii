import { V2PayClient } from "@/components/v2/v2-pay-client";
import { V2Shell } from "@/components/v2/v2-shell";

export default async function V2PayPage({
  params
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  return (
    <V2Shell className="flex items-center">
      <V2PayClient tag={tag} />
    </V2Shell>
  );
}
