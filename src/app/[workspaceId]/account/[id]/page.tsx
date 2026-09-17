export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccountWithTransactions } from "@/actions/account";
import { getWorkspace } from "@/actions/workspace";
import { formatCurrency } from "@/lib/utils";
import { PocketCard } from "@/components/pockets/pocket-card";
import { CreatePocketDialog } from "@/components/pockets/create-pocket-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Layers, Plus, PlusCircle, Sparkles } from "lucide-react";
import { AccountChart } from "@/components/account/account-chart";
import { TransactionTable } from "@/components/account/transaction-table";

interface AccountPageProps {
  params: Promise<{
    workspaceId: string;
    id: string;
  }>;
}

export default async function AccountDetailPage({ params }: AccountPageProps) {
  const { workspaceId, id } = await params;
  const [accountData, workspace] = await Promise.all([
    getAccountWithTransactions(id),
    getWorkspace(workspaceId),
  ]);

  if (!accountData) {
    notFound();
  }

  const currency = workspace?.currency ?? "INR";
  const { transactions, pockets, ...account } = accountData;

  const totalPocketBalance = pockets.reduce(
    (acc, p) => acc + Number(p.currentBalance),
    0,
  );
  const directAccountBalance = Number(account.balance) - totalPocketBalance;

  return (
    <div className="space-y-8 pb-12">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href={`/${workspaceId}/dashboard`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Account Header */}
      <div className="border-border/70 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-3xl font-bold tracking-tight capitalize sm:text-4xl">
              {account.name}
            </h1>
            <Badge variant="secondary" className="text-xs capitalize">
              {account.type.toLowerCase()}
            </Badge>
            {account.isDefault && (
              <Badge
                variant="outline"
                className="border-primary/30 text-primary text-xs"
              >
                Default
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Account ID:{" "}
            <span className="font-mono text-[11px]">{account.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CreatePocketDialog
            accounts={[{ id: account.id, name: account.name }]}
            defaultAccountId={account.id}
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Layers className="text-primary h-3.5 w-3.5" />
                Add Pocket
              </Button>
            }
          />

          <Link href={`/${workspaceId}/transaction/create`}>
            <Button size="sm" className="gap-1.5 text-xs">
              <PlusCircle className="h-3.5 w-3.5" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Balances Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              Total Account Balance
            </span>
            <div className="text-foreground mt-1.5 text-2xl font-bold">
              {formatCurrency(Number(account.balance), currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {account._count?.transactions ?? transactions.length} total
              transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              Allocated in Pockets
            </span>
            <div className="text-foreground mt-1.5 text-2xl font-bold">
              {formatCurrency(totalPocketBalance, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Across {pockets.length}{" "}
              {pockets.length === 1 ? "pocket" : "pockets"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              Unassigned / Direct Balance
            </span>
            <div className="text-foreground mt-1.5 text-2xl font-bold">
              {formatCurrency(directAccountBalance, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Available outside any specific pocket
            </p>
          </CardContent>
        </Card>
      </div>

      {/* POCKETS CONTAINER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold tracking-tight">
              <Layers className="text-primary h-4 w-4" />
              Pockets in this Account
            </h2>
            <p className="text-muted-foreground text-xs">
              Purpose-driven sub-allocations and savings goals inside{" "}
              {account.name}.
            </p>
          </div>

          <CreatePocketDialog
            accounts={[{ id: account.id, name: account.name }]}
            defaultAccountId={account.id}
            trigger={
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                New Pocket
              </Button>
            }
          />
        </div>

        {pockets.length === 0 ? (
          <Card className="border-border/80 bg-accent/15 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">
                No pockets in this account
              </h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md text-xs">
                You can create pockets like &ldquo;Groceries&rdquo;,
                &ldquo;Bills&rdquo;, or &ldquo;Savings Goal&rdquo; to partition
                this account&apos;s funds without having to open new bank
                accounts.
              </p>
              <CreatePocketDialog
                accounts={[{ id: account.id, name: account.name }]}
                defaultAccountId={account.id}
                trigger={
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    Create First Pocket
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pockets.map((pocket) => (
              <PocketCard
                key={pocket.id}
                currency={currency}
                pocket={{
                  ...pocket,
                  financialAccount: { id: account.id, name: account.name },
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="space-y-3">
        <h2 className="text-foreground text-lg font-bold tracking-tight">
          Cash Flow Activity
        </h2>
        <AccountChart transactions={transactions} currency={currency} />
      </div>

      {/* Transactions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-bold tracking-tight">
            Account Transactions
          </h2>
          <span className="text-muted-foreground text-xs">
            {transactions.length} recorded transactions
          </span>
        </div>

        <TransactionTable
          transactions={transactions}
          workspaceId={workspaceId}
          currency={currency}
        />
      </div>
    </div>
  );
}
