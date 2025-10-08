"use client";

import { useState, useEffect, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface Budget {
  amount: number;
}

interface BudgetProgressProps {
  initialBudget?: Budget | null;
  currentExpenses: number;
}

/** Format number in Indian currency style ₹00,00,000.00 */
const formatCurrencyINR = (value: number | string): string => {
  const amount = typeof value === "number" ? value : Number(value) || 0;
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
};

/** Detect touch devices for hiding keyboard hints */
const isTouchDevice = () =>
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

export function BudgetProgress({
  initialBudget,
  currentExpenses,
}: BudgetProgressProps) {
  const budgetAmount = initialBudget?.amount ?? 0;
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(budgetAmount.toString());

  /** Detect device once */
  const touchDevice = useMemo(() => isTouchDevice(), []);

  /** Determine platform keys for shortcut display */
  const { modifier, key } = useMemo(() => {
    if (typeof navigator === "undefined") return { modifier: "Ctrl", key: "B" };
    const isMac =
      typeof navigator !== "undefined" &&
      /(Mac|iPhone|iPad|iPod)/i.test(navigator.userAgent);
    return isMac ? { modifier: "⌘", key: "B" } : { modifier: "Ctrl", key: "B" };
  }, []);

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch<{
    success?: boolean;
    data?: Budget;
  }>(updateBudget);

  /** Calculate percentage used */
  const percentUsed =
    budgetAmount > 0
      ? (currentExpenses / budgetAmount) * 100
      : currentExpenses > 0
        ? 100
        : 0;

  /** Determine progress color */
  const progressColor = cn(
    "[&>div]:transition-all",
    percentUsed >= 100
      ? "[&>div]:bg-red-600"
      : percentUsed >= 90
        ? "[&>div]:bg-red-500"
        : percentUsed >= 75
          ? "[&>div]:bg-orange-500"
          : percentUsed >= 50
            ? "[&>div]:bg-yellow-500"
            : "[&>div]:bg-green-500",
  );

  /** Handle budget update */
  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(amount);
  };

  /** Cancel editing */
  const handleCancel = () => {
    setNewBudget(budgetAmount.toString());
    setIsEditing(false);
  };

  /** Keyboard shortcut to toggle editing (Ctrl/Cmd + B) */
  useEffect(() => {
    if (touchDevice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (modifier === "⌘" ? e.metaKey : e.ctrlKey) &&
        e.key.toUpperCase() === key
      ) {
        e.preventDefault();
        setIsEditing((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modifier, key, touchDevice]);

  /** Update local state on success */
  useEffect(() => {
    if (updatedBudget?.success && updatedBudget?.data?.amount) {
      setNewBudget(updatedBudget.data.amount.toString());
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  /** Show error if API fails */
  useEffect(() => {
    if (error) toast.error(error.message || "Failed to update budget");
  }, [error]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">
            Monthly Budget (Default Account){" "}
            {!touchDevice && (
              <KbdGroup>
                <Kbd>{modifier}</Kbd>
                <span>+</span>
                <Kbd>{key}</Kbd>
              </KbdGroup>
            )}
          </CardTitle>

          <div className="mt-1 flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") await handleUpdateBudget();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="min-w-[120px]"
                  placeholder="Enter amount"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <CardDescription>
                  {initialBudget
                    ? `${formatCurrencyINR(currentExpenses)} of ${formatCurrencyINR(budgetAmount)} spent`
                    : "No budget set"}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-5 w-5"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!!initialBudget && (
          <div className="space-y-2">
            <Progress
              value={Math.min(percentUsed, 100)}
              className={progressColor}
            />
            <p className="text-muted-foreground text-right text-xs">
              {budgetAmount === 0 && currentExpenses > 0
                ? `${formatCurrencyINR(currentExpenses)} spent`
                : isNaN(percentUsed)
                  ? "—"
                  : `${percentUsed.toFixed(1)}% used`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
