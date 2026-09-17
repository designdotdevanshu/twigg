export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { getWorkspace } from "@/actions/workspace";
import { getUserUpiIds, getPaymentLinks } from "@/actions/upi";
import { getUserAccounts } from "@/actions/dashboard";
import { UpiManager } from "@/components/upi/upi-manager";

export default async function UpiPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const [workspace, upiIds, links, accounts] = await Promise.all([
    getWorkspace(workspaceId),
    getUserUpiIds(),
    getPaymentLinks(workspaceId),
    getUserAccounts(workspaceId),
  ]);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-12">
      <UpiManager
        workspaceId={workspaceId}
        initialUpiIds={upiIds}
        initialLinks={links}
        accounts={accounts}
        userName={session?.user?.name ?? undefined}
        currency={workspace.currency}
      />
    </div>
  );
}
