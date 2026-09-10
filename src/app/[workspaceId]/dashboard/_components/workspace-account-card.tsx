"use client";

import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { updateDefaultAccount } from "@/actions/account";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Layers, ChevronRight } from "lucide-react";
import type { FinancialAccountWithRelations } from "@/actions/dashboard";

interface WorkspaceAccountCardProps {
  account: FinancialAccountWithRelations;
  workspaceId: string;
  currency?: string;
}

export function WorkspaceAccountCard({
  account,
  workspaceId,
  currency = "INR",
}: WorkspaceAccountCardProps) {
  const balance = Number(account.balance);
  const pocketCount = account._count?.pockets ?? account.pockets?.length ?? 0;
  const transactionCount = account._count?.transactions ?? 0;

  const handleDefaultToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (account.isDefault) {
      toast.warning("At least one account must remain the default");
      return;
    }

    try {
      const res = await updateDefaultAccount(account.id);
      if (res?.success) {
        toast.success(`Set ${account.name} as default account`);
      }
    } catch {
      toast.error("Failed to update default account");
    }
  };

  return (
    <Card className="group hover:border-foreground/40 relative transition-all duration-200 hover:shadow-sm">
      <Link
        href={`/${workspaceId}/account/${account.id}`}
        className="block p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-accent text-foreground flex h-9 w-9 items-center justify-center rounded-lg">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-foreground line-clamp-1 text-sm font-semibold tracking-tight">
                {account.name}
              </h4>
              <p className="text-muted-foreground text-[11px] capitalize">
                {account.type.toLowerCase()} Account
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {account.isDefault && (
              <Badge variant="secondary" className="text-[10px] font-medium">
                Default
              </Badge>
            )}
            <Switch
              id={`account-default-${account.id}`}
              checked={account.isDefault}
              onClick={handleDefaultToggle}
              aria-label={`Set ${account.name} as default account`}
              title="Toggle default account"
            />
          </div>
        </div>

        <div className="mt-5">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Account Balance
          </span>
          <div className="text-foreground text-2xl font-bold tracking-tight">
            {formatCurrency(balance, currency)}
          </div>
        </div>

        <div className="border-border/50 text-muted-foreground mt-4 flex items-center justify-between border-t pt-3 text-xs">
          <div className="flex items-center gap-1">
            <Layers className="text-primary h-3.5 w-3.5" />
            <span>
              {pocketCount} {pocketCount === 1 ? "pocket" : "pockets"}
            </span>
          </div>

          <div className="text-foreground group-hover:text-primary flex items-center gap-1 font-medium transition">
            <span>{transactionCount} txs</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
