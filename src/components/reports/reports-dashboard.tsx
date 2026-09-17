"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { defaultCategories, getCategoryName } from "@/data/categories";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/actions/transaction";
import type { FinancialAccount } from "@/actions/account";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";

interface ReportsDashboardProps {
  transactions: Transaction[];
  accounts: FinancialAccount[];
  workspaceName: string;
  currency?: string;
}

const PALETTE = [
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#84cc16", // lime
];

export function ReportsDashboard({
  transactions,
  accounts,
  workspaceName,
  currency = "INR",
}: ReportsDashboardProps) {
  const [timeRange, setTimeRange] = useState("6m"); // 1m, 3m, 6m, 1y, all

  // Filter transactions by selected date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeRange === "1m") {
      startDate = subMonths(now, 1);
    } else if (timeRange === "3m") {
      startDate = subMonths(now, 3);
    } else if (timeRange === "6m") {
      startDate = subMonths(now, 6);
    } else if (timeRange === "1y") {
      startDate = subMonths(now, 12);
    } else {
      startDate = new Date(2000, 0, 1);
    }

    return transactions.filter((t) => new Date(t.date) >= startDate);
  }, [transactions, timeRange]);

  // Aggregate stats
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round((netSavings / totalIncome) * 100))
      : 0;

  // Monthly trends data (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, "MMM yy");

      const monthTx = transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start, end }),
      );

      const income = monthTx
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTx
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      months.push({
        month: label,
        Income: income,
        Expenses: expense,
        Net: income - expense,
      });
    }

    return months;
  }, [transactions]);

  // Category breakdown for expenses
  const categoryData = useMemo(() => {
    const expenseTx = filteredTransactions.filter((t) => t.type === "EXPENSE");
    const categoryTotals: Record<string, number> = {};

    for (const t of expenseTx) {
      const cat = t.category || "other-expense";
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(t.amount);
    }

    return Object.entries(categoryTotals)
      .map(([catId, value], index) => {
        const catObj = defaultCategories.find((c) => c.id === catId);
        return {
          name: getCategoryName(catId),
          value,
          color: catObj?.color ?? PALETTE[index % PALETTE.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Account balance distribution
  const accountDistributionData = useMemo(() => {
    return accounts.map((acc, index) => ({
      name: acc.name,
      balance: Number(acc.balance),
      color: PALETTE[index % PALETTE.length],
    }));
  }, [accounts]);

  // Print report to PDF
  const handlePrint = () => {
    window.print();
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Amount",
      "Category",
      "Description",
      "Account",
      "Pocket",
    ];

    const rows = filteredTransactions.map((t) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.type,
      t.amount,
      `"${getCategoryName(t.category)}"`,
      `"${(t.description ?? "").replace(/"/g, '""')}"`,
      `"${t.financialAccount?.name ?? ""}"`,
      `"${t.pocket?.name ?? ""}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `twigg_${workspaceName.toLowerCase().replace(/\s+/g, "_")}_report_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Financial report exported as CSV");
  };

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Header with Export Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Reports & Financial Analytics
            </h1>
            <Badge variant="secondary" className="text-xs">
              {workspaceName}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            In-depth spending trends, income vs expenses comparisons, category
            distributions, and downloadable statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-9 w-[125px] text-xs">
              <Calendar className="text-muted-foreground mr-1 h-3.5 w-3.5" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m" className="text-xs">
                Last Month
              </SelectItem>
              <SelectItem value="3m" className="text-xs">
                Last 3 Months
              </SelectItem>
              <SelectItem value="6m" className="text-xs">
                Last 6 Months
              </SelectItem>
              <SelectItem value="1y" className="text-xs">
                Last Year
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                All Time
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="h-9 gap-1.5 bg-emerald-500 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="mb-4 hidden border-b pb-4 print:block">
        <h1 className="text-xl font-bold text-slate-900">
          Twigg Financial Statement &bull; {workspaceName}
        </h1>
        <p className="text-xs text-slate-600">
          Generated on {format(new Date(), "PPP")} &bull; Currency: {currency}
        </p>
      </div>

      {/* Key Metric Snapshot Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Total Inflow
              </span>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalIncome, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Total Outflow
              </span>
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              -{formatCurrency(totalExpense, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Net Savings
              </span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <div
              className={`mt-2 text-2xl font-bold tracking-tight ${
                netSavings >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {netSavings >= 0 ? "+" : ""}
              {formatCurrency(netSavings, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Income minus expenses
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Savings Rate
              </span>
              <BarChart3 className="text-primary h-4 w-4" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              {savingsRate}%
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Portion of income retained
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 6-Month Income vs Expenses Comparison Chart */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            Income vs Expenses Pacing (Past 6 Months)
          </CardTitle>
          <CardDescription className="text-xs">
            Monthly cash flow balance and expenditure pacing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  formatter={(val) => [
                    formatCurrency(Number(val), currency),
                    "",
                  ]}
                  contentStyle={{
                    backgroundColor: "#0c1017",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Section: Category Donut & Account Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown Donut */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="h-4 w-4 text-emerald-500" />
              Expense Breakdown by Category
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of expenses across spending categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="text-muted-foreground flex h-[240px] items-center justify-center text-xs">
                No expense transactions recorded in this period.
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="h-[220px] w-[220px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val) => [
                          formatCurrency(Number(val), currency),
                          "",
                        ]}
                        contentStyle={{
                          backgroundColor: "#0c1017",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="max-h-[220px] w-full flex-1 space-y-2 overflow-y-auto pr-1">
                  {categoryData.slice(0, 6).map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-muted-foreground truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-foreground shrink-0 font-semibold">
                        {formatCurrency(cat.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Reserves & Distribution */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Landmark className="h-4 w-4 text-indigo-500" />
              Account Balance Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Current reserves across configured financial accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-muted-foreground flex h-[240px] items-center justify-center text-xs">
                No accounts created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {accountDistributionData.map((acc) => {
                  const total = accounts.reduce(
                    (sum, a) => sum + Number(a.balance),
                    0,
                  );
                  const pct =
                    total > 0 ? Math.round((acc.balance / total) * 100) : 0;

                  return (
                    <div key={acc.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground flex items-center gap-2 font-semibold">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: acc.color }}
                          />
                          {acc.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {pct}%
                          </span>
                          <span className="text-foreground font-bold">
                            {formatCurrency(acc.balance, currency)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-accent/40 h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: acc.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
