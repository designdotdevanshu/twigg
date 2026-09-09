"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wallet,
  Target,
  ShoppingBag,
  Home,
  Car,
  Plane,
  Film,
  Zap,
} from "lucide-react";
import type { PocketWithMeta } from "@/actions/pocket";

const POCKET_ICONS: Record<string, React.ReactNode> = {
  groceries: <ShoppingBag className="h-4 w-4" />,
  rent: <Home className="h-4 w-4" />,
  commute: <Car className="h-4 w-4" />,
  travel: <Plane className="h-4 w-4" />,
  entertainment: <Film className="h-4 w-4" />,
  bills: <Zap className="h-4 w-4" />,
  default: <Wallet className="h-4 w-4" />,
};

interface PocketCardProps {
  pocket: PocketWithMeta;
  currency?: string;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function PocketCard({
  pocket,
  currency = "INR",
  onSelect,
  isSelected = false,
}: PocketCardProps) {
  const balance = Number(pocket.currentBalance);
  const isOverdrawn = balance < 0;
  const goal = pocket.goalAmount ? Number(pocket.goalAmount) : null;
  const rawProgress =
    goal && goal > 0 ? Math.round((balance / goal) * 100) : null;
  const progress =
    rawProgress !== null ? Math.max(0, Math.min(100, rawProgress)) : null;

  // Determine icon based on name matching or fallback
  const lowerName = pocket.name.toLowerCase();
  let icon = POCKET_ICONS.default;
  for (const [key, iconNode] of Object.entries(POCKET_ICONS)) {
    if (lowerName.includes(key)) {
      icon = iconNode;
      break;
    }
  }

  const pocketColor = pocket.color ?? "#0ea5e9";

  return (
    <Card
      onClick={onSelect}
      className={`group hover:border-foreground/30 relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-sm ${
        isSelected
          ? "border-foreground/80 bg-accent/30 ring-foreground/60 ring-1"
          : "bg-card"
      }`}
    >
      {/* Subtle top color strip */}
      <div className="h-1 w-full" style={{ backgroundColor: pocketColor }} />

      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md text-white shadow-xs"
              style={{ backgroundColor: pocketColor }}
            >
              {icon}
            </div>
            <div>
              <h4 className="text-foreground line-clamp-1 text-sm font-semibold tracking-tight">
                {pocket.name}
              </h4>
              {pocket.financialAccount && (
                <p className="text-muted-foreground line-clamp-1 text-[11px]">
                  in {pocket.financialAccount.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isOverdrawn && (
              <Badge
                variant="outline"
                className="border-rose-500/40 bg-rose-500/10 text-[10px] font-semibold text-rose-600 dark:text-rose-400"
              >
                Overdrawn
              </Badge>
            )}
            <Badge
              variant="outline"
              className="border-border/80 text-[10px] font-medium"
            >
              {pocket._count?.transactions ?? 0} tx
            </Badge>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mt-4">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Pocket Balance
          </span>
          <div
            className={`text-xl font-bold tracking-tight sm:text-2xl ${isOverdrawn ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}
          >
            {formatCurrency(balance, currency)}
          </div>
        </div>

        {/* Goal Progress (if configured) */}
        {goal && progress !== null && (
          <div className="border-border/40 mt-3 space-y-1.5 border-t pt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Target:{" "}
                {formatCurrency(goal, currency)}
              </span>
              <span
                className={`font-semibold ${isOverdrawn ? "text-rose-500" : "text-foreground"}`}
              >
                {isOverdrawn ? "0% (Deficit)" : `${rawProgress}%`}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
