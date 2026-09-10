export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransaction, type Transaction } from "@/actions/transaction";
import { getUserAccounts } from "@/actions/dashboard";
import { getWorkspace } from "@/actions/workspace";
import { defaultCategories } from "@/data/categories";
import { WorkspaceTransactionForm } from "../_components/workspace-transaction-form";
import { ArrowLeft, PlusCircle } from "lucide-react";

type AddTransactionPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export default async function AddTransactionPage({
  params,
  searchParams,
}: AddTransactionPageProps) {
  const { workspaceId } = await params;
  const editId = (await searchParams)?.edit;

  const [workspace, accounts] = await Promise.all([
    getWorkspace(workspaceId),
    getUserAccounts(workspaceId),
  ]);

  if (!workspace) {
    notFound();
  }

  let initialData = null as Transaction | null;
  if (editId) {
    try {
      initialData = await getTransaction(editId);
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
    }

    if (!initialData) {
      notFound();
    }
  }

  const title = editId ? "Edit Transaction" : "Record Transaction";
  const subtitle = editId
    ? "Modify details or reallocate pocket for this transaction"
    : `Add a transaction directly or allocate it into a pocket within ${workspace.name}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div>
        <Link
          href={`/${workspaceId}/dashboard`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="border-border/70 border-b pb-4">
        <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <PlusCircle className="text-primary h-6 w-6" />
          {title}
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          {subtitle}
        </p>
      </div>

      <WorkspaceTransactionForm
        workspaceId={workspaceId}
        accounts={accounts}
        categories={defaultCategories}
        editId={editId}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
}
