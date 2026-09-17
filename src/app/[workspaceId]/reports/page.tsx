export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getWorkspace } from "@/actions/workspace";
import { getWorkspaceTransactions } from "@/actions/transaction";
import { getUserAccounts } from "@/actions/dashboard";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [workspace, transactions, accounts] = await Promise.all([
    getWorkspace(workspaceId),
    getWorkspaceTransactions(workspaceId),
    getUserAccounts(workspaceId),
  ]);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-12">
      <ReportsDashboard
        transactions={transactions}
        accounts={accounts}
        workspaceName={workspace.name}
        currency={workspace.currency}
      />
    </div>
  );
}
