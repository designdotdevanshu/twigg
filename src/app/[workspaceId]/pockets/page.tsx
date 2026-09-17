export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getWorkspace } from "@/actions/workspace";
import { getUserAccounts } from "@/actions/dashboard";
import { getWorkspacePockets } from "@/actions/pocket";
import { formatCurrency } from "@/lib/utils";
import { PocketCard } from "@/components/pockets/pocket-card";
import { CreatePocketDialog } from "@/components/pockets/create-pocket-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Sparkles, Target, PiggyBank, Plus } from "lucide-react";

export default async function PocketsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [workspace, accounts, pockets] = await Promise.all([
    getWorkspace(workspaceId),
    getUserAccounts(workspaceId),
    getWorkspacePockets(workspaceId),
  ]);

  if (!workspace) {
    notFound();
  }

  const currency = workspace.currency;

  const totalAllocated = pockets.reduce(
    (sum, p) => sum + Number(p.currentBalance),
    0,
  );

  const totalGoals = pockets
    .filter((p) => p.goalAmount && Number(p.goalAmount) > 0)
    .reduce((sum, p) => sum + Number(p.goalAmount), 0);

  const goalProgress =
    totalGoals > 0
      ? Math.min(100, Math.round((totalAllocated / totalGoals) * 100))
      : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Pockets & Sub-Funds
            </h1>
            <Badge variant="secondary" className="text-xs">
              {pockets.length} {pockets.length === 1 ? "Pocket" : "Pockets"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Earmark balances inside your accounts for goals, emergency funds,
            groceries, or bills without opening new bank accounts.
          </p>
        </div>

        {accounts.length > 0 && (
          <CreatePocketDialog
            accounts={accounts}
            trigger={
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-500 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
              >
                <Plus className="h-4 w-4" />
                Create Pocket
              </Button>
            }
          />
        )}
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Total in Pockets
              </span>
              <Layers className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              {formatCurrency(totalAllocated, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Safely partitioned from operating balances
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Total Target Goals
              </span>
              <Target className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              {totalGoals > 0
                ? formatCurrency(totalGoals, currency)
                : "No goals set"}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Combined target across all pocket goals
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Goal Funding Pace
              </span>
              <PiggyBank className="text-primary h-4 w-4" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              {goalProgress}%
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Average progress towards target objectives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pockets Grid */}
      <div className="space-y-4">
        {pockets.length === 0 ? (
          <Card className="border-border/80 bg-accent/15 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <div className="bg-primary/10 text-primary mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">
                No pockets created yet
              </h3>
              <p className="text-muted-foreground mt-1 mb-5 max-w-md text-xs">
                Pockets act as logical partitions inside your accounts (e.g.
                Emergency Fund, New Laptop, Annual Insurance) so you can
                separate your savings without opening new bank accounts.
              </p>
              {accounts.length > 0 ? (
                <CreatePocketDialog
                  accounts={accounts}
                  trigger={
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Create Your First Pocket
                    </Button>
                  }
                />
              ) : (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Please add a financial account first before creating pockets.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pockets.map((pocket) => (
              <PocketCard key={pocket.id} pocket={pocket} currency={currency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
