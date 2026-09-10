"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, PiggyBank } from "lucide-react";
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
import { updateBudget } from "@/actions/budget";
import { formatCurrency } from "@/lib/utils";

interface WorkspaceBudgetCardProps {
  workspaceId: string;
  initialBudget?: { amount: number } | null;
  currentExpenses: number;
  currency?: string;
}

export function WorkspaceBudgetCard({
  workspaceId,
  initialBudget,
  currentExpenses,
  currency = "INR",
}: WorkspaceBudgetCardProps) {
  const [budgetAmount, setBudgetAmount] = useState(initialBudget?.amount ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(budgetAmount.toString());
  const [loading, setLoading] = useState(false);

  const percentUsed =
    budgetAmount > 0
      ? (currentExpenses / budgetAmount) * 100
      : currentExpenses > 0
        ? 100
        : 0;

  const handleSave = async () => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    setLoading(true);
    try {
      const res = await updateBudget(workspaceId, num);
      if (res.success && res.data) {
        setBudgetAmount(res.data.amount);
        setIsEditing(false);
        toast.success("Monthly budget updated");
      } else {
        toast.error(res.error ?? "Failed to update budget");
      }
    } catch {
      toast.error("Error saving budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <PiggyBank className="text-primary h-4 w-4" />
            Monthly Spending Limit
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs">
            {budgetAmount > 0
              ? `${formatCurrency(currentExpenses, currency)} spent of ${formatCurrency(budgetAmount, currency)}`
              : "No spending limit configured"}
          </CardDescription>
        </div>

        <div>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="10"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-8 w-24 text-xs"
                placeholder="0.00"
                autoFocus
                disabled={loading}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleSave}
                disabled={loading}
              >
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setInputValue(budgetAmount.toString());
                  setIsEditing(false);
                }}
                disabled={loading}
              >
                <X className="h-3.5 w-3.5 text-rose-500" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2.5 text-xs"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3 w-3" />
              {budgetAmount > 0 ? "Edit" : "Set Limit"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {budgetAmount > 0 ? (
          <div className="space-y-2 pt-1">
            <Progress
              value={Math.max(0, Math.min(percentUsed, 100))}
              className="h-2"
            />
            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
              <span>{Math.round(percentUsed)}% consumed</span>
              <span>
                {budgetAmount - currentExpenses > 0
                  ? `${formatCurrency(budgetAmount - currentExpenses, currency)} left`
                  : "Limit exceeded"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground pt-1 text-xs">
            Set a monthly ceiling to track expense pacing across all accounts.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
