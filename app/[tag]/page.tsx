import { PageShell } from "@/components/layout/page-shell";
import { PublicRouteResolver } from "@/components/public/public-route-resolver";

export default async function TagPayPage({
  params
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  return (
    <PageShell className="flex items-start pt-6 sm:pt-10" largeLogo>
      <PublicRouteResolver tag={tag} />
    </PageShell>
  );
}
