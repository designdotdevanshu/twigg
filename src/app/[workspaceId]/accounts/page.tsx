export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getWorkspace } from "@/actions/workspace";
import { getUserAccounts } from "@/actions/dashboard";
import { formatCurrency } from "@/lib/utils";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { WorkspaceAccountCard } from "../dashboard/_components/workspace-account-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Plus,
  Landmark,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [workspace, accounts] = await Promise.all([
    getWorkspace(workspaceId),
    getUserAccounts(workspaceId),
  ]);

  if (!workspace) {
    notFound();
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Financial Accounts
            </h1>
            <Badge variant="secondary" className="text-xs">
              {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage your underlying bank, savings, checking, and operating
            accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateAccountDrawer workspaceId={workspaceId}>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </CreateAccountDrawer>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Total Liquidity
              </span>
              <Landmark className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight tabular-nums">
              {formatCurrency(totalBalance, workspace.currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Across all configured accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Primary Account
              </span>
              <ShieldCheck className="text-primary h-4 w-4" />
            </div>
            <div className="text-foreground mt-2 truncate text-base font-bold tracking-tight">
              {accounts.find((a) => a.isDefault)?.name ?? "None selected"}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Used as the default source for new transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider uppercase">
                Currency
              </span>
              <CreditCard className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              {workspace.currency}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Active currency for this workspace
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-base font-semibold">
            All Accounts
          </h2>
        </div>

        {accounts.length === 0 ? (
          <Card className="border-border/80 bg-accent/15 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <div className="bg-primary/10 text-primary mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Landmark className="h-7 w-7" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">
                No financial accounts added yet
              </h3>
              <p className="text-muted-foreground mt-1 mb-5 max-w-md text-xs">
                Add your bank, credit card, or cash accounts to start tracking
                your transactions, allocating pockets, and calculating net
                worth.
              </p>
              <CreateAccountDrawer workspaceId={workspaceId}>
                <Button size="sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Add Your First Account
                </Button>
              </CreateAccountDrawer>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CreateAccountDrawer workspaceId={workspaceId}>
              <Card className="border-border/80 bg-accent/10 hover:border-foreground/40 hover:bg-accent/25 cursor-pointer border-dashed transition">
                <CardContent className="text-muted-foreground flex h-full min-h-[160px] flex-col items-center justify-center p-5">
                  <div className="bg-background border-border/80 mb-2 flex h-10 w-10 items-center justify-center rounded-full border">
                    <Plus className="text-foreground h-5 w-5" />
                  </div>
                  <p className="text-foreground text-xs font-semibold">
                    Add Another Account
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-center text-[11px]">
                    Savings, Checking, or Corporate
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
        )}
      </div>
    </div>
  );
}
