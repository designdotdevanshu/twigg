"use client";

import { useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import { format } from "date-fns";
import { TrendingDown, TrendingUp, Layers, ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { FinancialAccountWithRelations } from "@/actions/dashboard";
import type { Transaction } from "@/actions/transaction";

const FINTECH_COLORS = [
  "#10b981", // Emerald
  "#0ea5e9", // Sky
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f43f5e", // Rose
];

export function WorkspaceTransactionOverview({
  workspaceId,
  accounts,
  transactions,
  currency = "INR",
}: {
  workspaceId: string;
  accounts: FinancialAccountWithRelations[];
  transactions: Transaction[];
  currency?: string;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");

  const filteredTransactions =
    selectedAccountId === "ALL"
      ? transactions
      : transactions.filter((t) => t.financialAccountId === selectedAccountId);

  const recentTransactions = [...filteredTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Calculate expense breakdown for current month
  const currentDate = new Date();
  const currentMonthExpenses = filteredTransactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      t.type === "EXPENSE" &&
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Group expenses by category
  const expensesByCategory = currentMonthExpenses.reduce(
    (acc: Record<string, number>, transaction) => {
      const category = transaction.category || "Uncategorized";
      acc[category] = (acc[category] ?? 0) + Number(transaction.amount);
      return acc;
    },
    {},
  );

  const pieChartData = Object.entries(expensesByCategory).map(
    ([category, amount], index) => ({
      category:
        category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " "),
      amount: amount,
      fill: FINTECH_COLORS[index % FINTECH_COLORS.length],
    }),
  );

  const chartConfig = pieChartData.reduce(
    (config, item) => {
      config[item.category.toLowerCase().replace(/\s+/g, "-")] = {
        label: item.category,
        color: item.fill,
      };
      return config;
    },
    {
      amount: { label: "Amount" },
    } as ChartConfig,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Recent Transactions List (3 cols) */}
      <Card className="border-border/80 shadow-xs lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Recent Transactions
            </CardTitle>
            <CardDescription className="text-xs">
              Latest transactions across accounts and allocated pockets
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Accounts</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link
              href={`/${workspaceId}/transactions`}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <Link href={`/${workspaceId}/transaction/create`}>
              <Button
                size="sm"
                className="h-8 bg-emerald-500 px-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                + Add
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {recentTransactions.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-xs">
              No transactions recorded in this workspace yet.
            </div>
          ) : (
            <div>
              <div className="divide-border/60 divide-y">
                {recentTransactions.map((tx) => {
                  const isExpense = tx.type === "EXPENSE";
                  const pocketName = tx.pocket?.name;
                  const pocketColor = tx.pocket?.color ?? "#0ea5e9";

                  return (
                    <div
                      key={tx.id}
                      className="hover:bg-muted/40 flex items-center justify-between px-6 py-3.5 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                            isExpense
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {isExpense ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : (
                            <TrendingUp className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-foreground text-xs font-semibold">
                              {tx.description ?? tx.category}
                            </p>
                            {pocketName && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: `${pocketColor}20`,
                                  color: pocketColor,
                                }}
                              >
                                <Layers className="h-2.5 w-2.5" />
                                {pocketName}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            {format(new Date(tx.date), "MMM d, yyyy")} &bull;{" "}
                            {tx.financialAccount?.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={cn(
                            "font-mono text-xs font-bold tabular-nums",
                            isExpense
                              ? "text-foreground"
                              : "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {isExpense ? "-" : "+"}
                          {formatCurrency(Number(tx.amount), currency)}
                        </p>
                        <p className="text-muted-foreground text-[10px] capitalize">
                          {tx.category}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-border/60 border-t p-3 text-center">
                <Link
                  href={`/${workspaceId}/transactions`}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition"
                >
                  View complete transaction history{" "}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Expense Breakdown Pie Chart (2 cols) */}
      <Card className="border-border/80 flex flex-col justify-between shadow-xs lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Monthly Category Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Spending distribution for {format(currentDate, "MMMM yyyy")}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col items-center justify-center pb-4">
          {pieChartData.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-xs">
              No expenses recorded for this month.
            </div>
          ) : (
            <div className="w-full">
              <ChartContainer
                config={chartConfig}
                className="mx-auto h-[220px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) =>
                          `${name}: ${formatCurrency(value, currency)}`
                        }
                      />
                    }
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="mt-2 grid grid-cols-2 gap-1.5 px-2">
                {pieChartData.slice(0, 4).map((entry) => (
                  <div
                    key={entry.category}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-muted-foreground truncate">
                      {entry.category}
                    </span>
                    <span className="text-foreground ml-auto font-semibold tabular-nums">
                      {formatCurrency(entry.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
