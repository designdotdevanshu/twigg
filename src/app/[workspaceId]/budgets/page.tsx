export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getWorkspace } from "@/actions/workspace";
import { getWorkspaceBudgets } from "@/actions/budget";
import { BudgetManager } from "@/components/budgets/budget-manager";
import { Badge } from "@/components/ui/badge";

export default async function BudgetsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [workspace, budgets] = await Promise.all([
    getWorkspace(workspaceId),
    getWorkspaceBudgets(workspaceId),
  ]);

  if (!workspace) {
    notFound();
  }

  const categoryBudgetsCount = budgets.filter(
    (b) => b.category !== "GLOBAL",
  ).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Budgets & Spending Limits
            </h1>
            <Badge variant="secondary" className="text-xs">
              {categoryBudgetsCount} Category Limits
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Establish global spending caps and category-level budgets to
            maintain financial discipline.
          </p>
        </div>
      </div>

      <BudgetManager
        workspaceId={workspaceId}
        initialBudgets={budgets}
        currency={workspace.currency}
      />
    </div>
  );
}
