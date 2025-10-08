"use client";

import { useState } from "react";
import { Pie, PieChart } from "recharts";
import { format } from "date-fns";
import { TrendingDown, TrendingUp } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { COLORS, formatCurrency } from "@/lib/constant";
import type { FinancialAccount } from "@/actions/account";
import type { Transaction } from "@/actions/transaction";

export function DashboardOverview({
  accounts,
  transactions,
}: {
  accounts: FinancialAccount[];
  transactions: Transaction[];
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id ?? accounts[0]?.id,
  );

  // Filter transactions for selected account
  const accountTransactions = transactions.filter(
    (t) => t.financialAccountId === selectedAccountId,
  );

  // Get recent transactions (last 5)
  const recentTransactions = accountTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Calculate expense breakdown for current month
  const currentDate = new Date();
  const currentMonthExpenses = accountTransactions.filter((t) => {
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
      const { category } = transaction;
      acc[category] ??= 0;
      acc[category] += Number(transaction.amount);
      return acc;
    },
    {},
  );

  // Capitalize first letter of each word
  const toCapitalize = (str: string) => {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
    });
  };

  // Format data for pie chart
  const pieChartData = Object.entries(expensesByCategory).map(
    ([category, amount], index) => ({
      category: toCapitalize(category.replace(/-/g, " ")),
      amount: amount,
      fill: COLORS[index % COLORS.length],
    }),
  );

  // Create chart config
  const chartConfig = pieChartData.reduce(
    (config, item) => {
      config[item.category.toLowerCase().replace(/\s+/g, "-")] = {
        label: item.category,
        color: item.fill,
      };
      return config;
    },
    {
      amount: {
        label: "Amount",
      },
    } as ChartConfig,
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Transactions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-normal">
            Recent Transactions
          </CardTitle>
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                No recent transactions
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm leading-none font-medium capitalize">
                      {transaction.description?.replace(/-/g, " ") ??
                        "Untitled Transaction"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(transaction.date), "PP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex items-center",
                        transaction.type === "EXPENSE"
                          ? "text-red-500"
                          : "text-green-500",
                      )}
                    >
                      {transaction.type === "EXPENSE" ? (
                        <TrendingDown className="mr-1 size-4" />
                      ) : (
                        <TrendingUp className="mr-1 size-4" />
                      )}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">
            Monthly Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          {pieChartData.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              No expenses this month
            </p>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="mx-auto max-h-[300px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) =>
                        `${name}: ${formatCurrency(value as number)}`
                      }
                    />
                  }
                />
                <Pie
                  data={pieChartData}
                  dataKey="amount"
                  nameKey="category"
                  label={({ category, amount }) =>
                    `${category}: ${formatCurrency(amount)}`
                  }
                />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
