"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { getUserSession } from "@/lib/auth";
import { handleError, serializeDecimal } from "@/lib/utils";
import type { Decimal } from "@prisma/client/runtime/library";
import type { FinancialAccountType, Pocket } from "@prisma/client";
import type { Transaction } from "./transaction";

export interface FinancialAccount {
  name: string;
  id: string;
  type: FinancialAccountType;
  balance: Decimal;
  isDefault: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountResponse {
  success: boolean;
  data?: FinancialAccount;
}

export interface AccountWithRelations extends FinancialAccount {
  pockets: Pocket[];
  transactions: Transaction[];
  _count: {
    transactions: number;
    pockets: number;
  };
}

export async function getAccountWithTransactions(
  id: string,
): Promise<AccountWithRelations | null> {
  if (!id) return null;

  try {
    const user = await getUserSession();
    if (!user?.id) return null;

    const account = await db.financialAccount.findFirst({
      where: {
        id,
        workspace: { userId: user.id },
      },
      include: {
        pockets: {
          orderBy: { createdAt: "asc" },
          include: {
            _count: { select: { transactions: true } },
          },
        },
        transactions: {
          orderBy: { date: "desc" },
          include: {
            pocket: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        _count: {
          select: { transactions: true, pockets: true },
        },
      },
    });

    if (!account) return null;

    return {
      ...serializeDecimal(account),
      pockets: account.pockets.map((p) =>
        serializeDecimal(p),
      ) as unknown as Pocket[],
      transactions: account.transactions.map((transaction) =>
        serializeDecimal(transaction),
      ) as unknown as Transaction[],
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeleteTransactions(transactionIds: string[]) {
  try {
    const user = await getUserSession();
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    // Get transactions to calculate balance changes
    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        workspace: { userId: user.id },
      },
    });

    // Group transactions by account and pocket to update balances
    const accountBalanceChanges = transactions.reduce(
      (acc, transaction) => {
        const change =
          transaction.type === "EXPENSE"
            ? transaction.amount.toNumber()
            : -transaction.amount.toNumber();
        acc[transaction.financialAccountId] =
          (acc[transaction.financialAccountId] ?? 0) + change;
        return acc;
      },
      {} as Record<string, number>,
    );

    const pocketBalanceChanges = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.pocketId) return acc;
        const change =
          transaction.type === "EXPENSE"
            ? transaction.amount.toNumber()
            : -transaction.amount.toNumber();
        acc[transaction.pocketId] = (acc[transaction.pocketId] ?? 0) + change;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Delete transactions and update account/pocket balances
    await db.$transaction(async (tx) => {
      // Delete transactions
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          workspace: { userId: user.id },
        },
      });

      // Update account balances
      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges,
      )) {
        await tx.financialAccount.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }

      // Update pocket balances
      for (const [pocketId, balanceChange] of Object.entries(
        pocketBalanceChanges,
      )) {
        await tx.pocket.update({
          where: { id: pocketId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    revalidatePath("/[workspaceId]/account/[id]", "page");

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDefaultAccount(
  id: string,
): Promise<AccountResponse | null> {
  try {
    const user = await getUserSession();
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const targetAccount = await db.financialAccount.findFirst({
      where: {
        id,
        workspace: { userId: user.id },
      },
    });

    if (!targetAccount) throw new Error("Account not found");

    // First, unset existing default in this workspace
    await db.financialAccount.updateMany({
      where: {
        workspaceId: targetAccount.workspaceId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Then set the new default account
    const account = await db.financialAccount.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    return {
      success: true,
      data: serializeDecimal(account) as unknown as AccountResponse["data"],
    };
  } catch (error) {
    return handleError(error);
  }
}
