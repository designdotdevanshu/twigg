export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/actions/workspace";
import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { getWorkspacePockets } from "@/actions/pocket";
import { getCurrentBudget } from "@/actions/budget";
import { formatCurrency } from "@/lib/utils";

import { WorkspaceAccountCard } from "./_components/workspace-account-card";
import { WorkspaceBudgetCard } from "./_components/workspace-budget-card";
import { WorkspaceTransactionOverview } from "./_components/workspace-transaction-overview";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { CreatePocketDialog } from "@/components/pockets/create-pocket-dialog";
import { PocketCard } from "@/components/pockets/pocket-card";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  Layers,
  Briefcase,
  User as UserIcon,
  Building2,
  Sparkles,
} from "lucide-react";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [workspace, accounts, transactions, pockets, budgetData] =
    await Promise.all([
      getWorkspace(workspaceId),
      getUserAccounts(workspaceId),
      getDashboardData(workspaceId),
      getWorkspacePockets(workspaceId),
      getCurrentBudget(workspaceId),
    ]);

  if (!workspace) {
    notFound();
  }

  const isPersonal = workspace.type === "PERSONAL";
  const isBusiness = workspace.type === "BUSINESS";

  // Financial aggregates
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const totalAllocatedPockets = pockets.reduce(
    (sum, p) => sum + Number(p.currentBalance),
    0,
  );

  // Current month stats
  const now = new Date();
  const currentMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const monthIncome = currentMonthTx
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthExpenses = currentMonthTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netCashflow = monthIncome - monthExpenses;

  // For business: runway calculation
  const monthlyBurn = monthExpenses > 0 ? monthExpenses : 1;
  const runwayMonths =
    isBusiness && totalBalance > 0
      ? (totalBalance / monthlyBurn).toFixed(1)
      : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Context */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              {workspace.name}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${
                isPersonal
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : "border-indigo-500/30 bg-indigo-500/10 text-indigo-600"
              }`}
            >
              {isPersonal ? (
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" /> Personal Finance
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Business Finance
                </span>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {isPersonal
              ? "Organize your money into Pockets, track budgets, and manage personal accounts."
              : "Monitor business runway, operational cash flow, corporate spending, and cost centers."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isPersonal && accounts.length > 0 && (
            <CreatePocketDialog
              accounts={accounts}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-medium"
                >
                  <Layers className="text-primary h-3.5 w-3.5" />+ Create Pocket
                </Button>
              }
            />
          )}

          <CreateAccountDrawer workspaceId={workspaceId}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />+ Add Account
            </Button>
          </CreateAccountDrawer>

          <Link href={`/${workspaceId}/transaction/create`}>
            <Button size="sm" className="gap-1.5 text-xs font-medium shadow-xs">
              <PlusCircle className="h-3.5 w-3.5" />
              New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Liquidity / Capital */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                {isPersonal ? "Total Net Worth" : "Total Cash Reserves"}
              </span>
              <Wallet className="h-4 w-4" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              {formatCurrency(totalBalance, workspace.currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Across {accounts.length} active{" "}
              {accounts.length === 1 ? "account" : "accounts"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Monthly Inflow */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                {isPersonal ? "Monthly Income" : "Monthly Revenue"}
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(monthIncome, workspace.currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Recorded this month
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Monthly Expenses */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                {isPersonal ? "Monthly Expenses" : "Operating Burn"}
              </span>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              -{formatCurrency(monthExpenses, workspace.currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Recorded this month
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Pockets Allocation (Personal) OR Runway (Business) */}
        {isPersonal ? (
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="text-muted-foreground flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider uppercase">
                  In Pockets
                </span>
                <Layers className="text-primary h-4 w-4" />
              </div>
              <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
                {formatCurrency(totalAllocatedPockets, workspace.currency)}
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {pockets.length} {pockets.length === 1 ? "pocket" : "pockets"}{" "}
                created
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="text-muted-foreground flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider uppercase">
                  Runway
                </span>
                <Briefcase className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
                {runwayMonths ? `${runwayMonths} mos` : "N/A"}
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Net cashflow: {netCashflow >= 0 ? "+" : ""}
                {formatCurrency(netCashflow, workspace.currency)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Spending Limit / Budget Banner */}
      <WorkspaceBudgetCard
        workspaceId={workspaceId}
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses ?? 0}
        currency={workspace.currency}
      />

      {/* POCKETS SECTION (Prominently featured for Personal Finance) */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-foreground text-lg font-bold tracking-tight">
                {isPersonal
                  ? "Pockets & Allocations"
                  : "Sub-Funds & Allocations"}
              </h2>
            </div>
            <p className="text-muted-foreground text-xs">
              Earmark money inside your accounts for goals, bills, groceries, or
              unexpected expenses.
            </p>
          </div>

          {accounts.length > 0 && (
            <CreatePocketDialog
              accounts={accounts}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 self-start text-xs sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Pocket
                </Button>
              }
            />
          )}
        </div>

        {pockets.length === 0 ? (
          <Card className="border-border/80 bg-accent/15 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">
                No pockets created yet
              </h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md text-xs">
                Pockets act as logical partitions inside your accounts (e.g.
                Groceries, Rent, Vacation Goal) so you can separate your savings
                without opening new bank accounts.
              </p>
              {accounts.length > 0 ? (
                <CreatePocketDialog
                  accounts={accounts}
                  trigger={
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      Create Your First Pocket
                    </Button>
                  }
                />
              ) : (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Create a financial account below to start adding pockets.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pockets.map((pocket) => (
              <PocketCard
                key={pocket.id}
                pocket={pocket}
                currency={workspace.currency}
              />
            ))}
          </div>
        )}
      </div>

      {/* FINANCIAL ACCOUNTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-bold tracking-tight">
              Financial Accounts
            </h2>
            <p className="text-muted-foreground text-xs">
              Manage your underlying bank, savings, and operating containers.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer workspaceId={workspaceId}>
            <Card className="border-border/80 bg-accent/10 hover:border-foreground/40 hover:bg-accent/25 cursor-pointer border-dashed transition">
              <CardContent className="text-muted-foreground flex h-full min-h-[140px] flex-col items-center justify-center p-5">
                <div className="bg-background border-border/80 mb-2 flex h-10 w-10 items-center justify-center rounded-full border">
                  <Plus className="text-foreground h-5 w-5" />
                </div>
                <p className="text-foreground text-xs font-semibold">
                  Add New Account
                </p>
                <p className="text-muted-foreground mt-0.5 text-center text-[11px]">
                  Checking, Savings, or Corporate Account
                </p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>

          {accounts.map((account) => (
            <WorkspaceAccountCard
              key={account.id}
              account={account}
              workspaceId={workspaceId}
              currency={workspace.currency}
            />
          ))}
        </div>
      </div>

      {/* TRANSACTIONS & MONTHLY BREAKDOWN */}
      <WorkspaceTransactionOverview
        workspaceId={workspaceId}
        accounts={accounts}
        transactions={transactions}
        currency={workspace.currency}
      />
    </div>
  );
}
