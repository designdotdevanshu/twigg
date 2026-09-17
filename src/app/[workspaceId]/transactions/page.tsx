export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/actions/workspace";
import { getWorkspaceTransactions } from "@/actions/transaction";
import { formatCurrency } from "@/lib/utils";
import { TransactionTable } from "@/components/account/transaction-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingDown,
  TrendingUp,
  PlusCircle,
  ReceiptText,
} from "lucide-react";

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [workspace, transactions] = await Promise.all([
    getWorkspace(workspaceId),
    getWorkspaceTransactions(workspaceId),
  ]);

  if (!workspace) {
    notFound();
  }

  const currency = workspace.currency;

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netCashFlow = totalIncome - totalExpense;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Transactions
            </h1>
            <Badge variant="secondary" className="text-xs">
              {transactions.length}{" "}
              {transactions.length === 1 ? "Record" : "Records"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Search, filter, categorize, and inspect all cash movements across
            your accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${workspaceId}/transaction/create`}>
            <Button size="sm">
              <PlusCircle className="h-4 w-4" />
              New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Total Inflow
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 tabular-nums dark:text-emerald-400">
              +{formatCurrency(totalIncome, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Across recorded income entries
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Total Outflow
              </span>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight tabular-nums">
              -{formatCurrency(totalExpense, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Across recorded expense entries
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Net Cash Flow
              </span>
              <ReceiptText className="h-4 w-4 text-indigo-500" />
            </div>
            <div
              className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${
                netCashFlow >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {netCashFlow >= 0 ? "+" : ""}
              {formatCurrency(netCashFlow, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Cumulative lifetime balance change
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Transactions Table Container */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-5">
          <TransactionTable
            transactions={transactions}
            workspaceId={workspaceId}
            currency={currency}
          />
        </CardContent>
      </Card>
    </div>
  );
}
