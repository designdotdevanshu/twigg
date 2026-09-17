"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  setCategoryBudget,
  deleteCategoryBudget,
  updateBudget,
  type BudgetWithSpending,
} from "@/actions/budget";
import { defaultCategories, getCategoryName } from "@/data/categories";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Layers,
} from "lucide-react";

interface BudgetManagerProps {
  workspaceId: string;
  initialBudgets: BudgetWithSpending[];
  currency?: string;
}

export function BudgetManager({
  workspaceId,
  initialBudgets,
  currency = "INR",
}: BudgetManagerProps) {
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>(initialBudgets);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryAmount, setCategoryAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  // Global budget state
  const globalBudget = budgets.find((b) => b.category === "GLOBAL");
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [globalInput, setGlobalInput] = useState(
    globalBudget ? String(globalBudget.amount) : "0",
  );
  const [globalLoading, setGlobalLoading] = useState(false);

  const categoryBudgets = budgets.filter((b) => b.category !== "GLOBAL");

  // Save global budget
  const handleSaveGlobal = async () => {
    const num = parseFloat(globalInput);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await updateBudget(workspaceId, num);
      if (res.success && res.data) {
        setBudgets((prev) => {
          const exists = prev.some((b) => b.category === "GLOBAL");
          if (exists) {
            return prev.map((b) =>
              b.category === "GLOBAL"
                ? {
                    ...b,
                    amount: res.data!.amount,
                    percentage:
                      res.data!.amount > 0
                        ? Math.round(
                            (b.currentExpenses / res.data!.amount) * 100,
                          )
                        : 0,
                  }
                : b,
            );
          } else {
            return [
              ...prev,
              {
                id: res.data!.id,
                amount: res.data!.amount,
                category: "GLOBAL",
                lastAlertSent: null,
                workspaceId,
                currentExpenses: 0,
                percentage: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
        });
        setIsEditingGlobal(false);
        toast.success("Global monthly budget updated");
      } else {
        toast.error(res.error ?? "Failed to update budget");
      }
    } catch {
      toast.error("Error saving budget");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Add or update category budget
  const handleAddCategoryBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(categoryAmount);
    if (!selectedCategory) {
      toast.error("Please choose a category");
      return;
    }
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid budget limit");
      return;
    }

    setSubmitting(true);
    try {
      const res = await setCategoryBudget(workspaceId, selectedCategory, num);
      if (res.success) {
        toast.success(`Budget for ${getCategoryName(selectedCategory)} saved`);
        setIsAddOpen(false);
        setSelectedCategory("");
        setCategoryAmount("");

        // Update local state
        setBudgets((prev) => {
          const exists = prev.some((b) => b.category === selectedCategory);
          if (exists) {
            return prev.map((b) =>
              b.category === selectedCategory
                ? {
                    ...b,
                    amount: num,
                    percentage:
                      num > 0 ? Math.round((b.currentExpenses / num) * 100) : 0,
                  }
                : b,
            );
          } else {
            return [
              ...prev,
              {
                id: Math.random().toString(),
                amount: num,
                category: selectedCategory,
                lastAlertSent: null,
                workspaceId,
                currentExpenses: 0,
                percentage: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
        });
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to set category budget");
      }
    } catch {
      toast.error("Error setting category budget");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category budget
  const handleDeleteCategoryBudget = async (category: string) => {
    try {
      const res = await deleteCategoryBudget(workspaceId, category);
      if (res.success) {
        setBudgets((prev) => prev.filter((b) => b.category !== category));
        router.refresh();
        toast.success("Category budget removed");
      } else {
        toast.error(res.error ?? "Failed to remove category budget");
      }
    } catch {
      toast.error("Error removing budget");
    }
  };

  // Predefined expense categories for selector
  const expenseCategories = defaultCategories.filter(
    (c) => c.type === "EXPENSE",
  );

  return (
    <div className="space-y-8">
      {/* 1. Global Monthly Spending Limit */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PiggyBank className="text-primary h-5 w-5" />
              Overall Monthly Budget
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Sets the workspace-wide ceiling across all accounts and
              categories.
            </CardDescription>
          </div>

          <div>
            {isEditingGlobal ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={globalInput}
                  onChange={(e) => setGlobalInput(e.target.value)}
                  className="h-8 w-28 font-mono text-xs"
                  placeholder="0.00"
                  disabled={globalLoading}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={handleSaveGlobal}
                  disabled={globalLoading}
                >
                  <Check className="h-4 w-4 text-emerald-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsEditingGlobal(false)}
                  disabled={globalLoading}
                >
                  <X className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setGlobalInput(
                    globalBudget ? String(globalBudget.amount) : "0",
                  );
                  setIsEditingGlobal(true);
                }}
              >
                <Pencil className="h-3 w-3" />
                {globalBudget ? "Edit Limit" : "Set Limit"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {globalBudget && globalBudget.amount > 0 ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-foreground text-2xl font-bold">
                    {formatCurrency(globalBudget.currentExpenses, currency)}
                  </span>
                  <span className="text-muted-foreground ml-1.5 text-xs">
                    spent of {formatCurrency(globalBudget.amount, currency)}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    globalBudget.percentage > 100
                      ? "text-rose-500"
                      : globalBudget.percentage > 85
                        ? "text-amber-500"
                        : "text-emerald-500"
                  }`}
                >
                  {globalBudget.percentage}% used
                </span>
              </div>

              <Progress
                value={Math.min(globalBudget.percentage, 100)}
                className="h-2.5"
              />

              <div className="text-muted-foreground flex items-center justify-between pt-1 text-[11px]">
                <span>
                  {globalBudget.amount - globalBudget.currentExpenses > 0
                    ? `${formatCurrency(
                        globalBudget.amount - globalBudget.currentExpenses,
                        currency,
                      )} remaining`
                    : "Spending limit exceeded"}
                </span>
                <span>Paced for current calendar month</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-2 text-xs">
              No global monthly spending ceiling has been configured yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. Category-Specific Budgets */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-base font-semibold">
              Category Budgets
            </h2>
            <p className="text-muted-foreground text-xs">
              Set dedicated limits for specific categories like Groceries,
              Dining, or Transportation.
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-500 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
              >
                <Plus className="h-4 w-4" />
                Add Category Budget
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleAddCategoryBudget}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    Configure Category Budget
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Choose a spending category and assign a monthly maximum
                    allowance.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select expense category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            className="text-xs"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Monthly Limit ({currency})
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 8000"
                      value={categoryAmount}
                      onChange={(e) => setCategoryAmount(e.target.value)}
                      className="h-9 font-mono text-xs"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    {submitting ? "Saving..." : "Save Budget"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {categoryBudgets.length === 0 ? (
          <Card className="border-border/80 bg-accent/15 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <PiggyBank className="h-6 w-6" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">
                No category budgets set
              </h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">
                Keep track of specific spending habits by setting targeted
                monthly allowances for Food, Entertainment, Shopping, or Travel.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Your First Category Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryBudgets.map((b) => {
              const catName = getCategoryName(b.category);
              const catObj = defaultCategories.find((c) => c.id === b.category);
              const isOver = b.currentExpenses > b.amount;

              return (
                <Card key={b.id} className="border-border/80 shadow-xs">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: catObj?.color ?? "#06b6d4",
                          }}
                        />
                        <span className="text-foreground truncate text-xs font-semibold">
                          {catName}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 w-7 p-0 hover:text-rose-500"
                        onClick={() => handleDeleteCategoryBudget(b.category)}
                        title="Delete budget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-foreground font-bold">
                          {formatCurrency(b.currentExpenses, currency)}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          of {formatCurrency(b.amount, currency)}
                        </span>
                      </div>

                      <Progress
                        value={Math.min(b.percentage, 100)}
                        className={`h-2 ${isOver ? "[&>div]:bg-rose-500" : ""}`}
                      />

                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={
                            isOver
                              ? "flex items-center gap-1 font-semibold text-rose-500"
                              : "text-muted-foreground"
                          }
                        >
                          {isOver && <AlertTriangle className="h-3 w-3" />}
                          {isOver
                            ? "Over budget"
                            : `${formatCurrency(
                                b.amount - b.currentExpenses,
                                currency,
                              )} left`}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {b.percentage}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
