"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { asyncHandler, handleError, serializeDecimal } from "@/lib/utils";
import { getUserSession } from "@/lib/auth";
import type { FinancialAccount, Pocket } from "@prisma/client";
import type { Transaction } from "./transaction";
import type { AccountInput } from "@/lib/schema";

export type FinancialAccountWithRelations = FinancialAccount & {
  pockets?: Pocket[];
  _count?: {
    transactions: number;
    pockets: number;
  };
};

export async function getUserAccounts(
  workspaceId: string,
): Promise<FinancialAccountWithRelations[]> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    // Verify user owns workspace
    const workspace = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });

    if (!workspace) return [];

    const accounts = await db.financialAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        pockets: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            transactions: true,
            pockets: true,
          },
        },
      },
    });

    return accounts.map(serializeDecimal);
  } catch (error) {
    return handleError(error);
  }
}

export async function createAccount(data: AccountInput, workspaceId: string) {
  return asyncHandler(async function (): Promise<FinancialAccount> {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const workspace = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });

    if (!workspace) throw new Error("Workspace not found or access denied");

    // Convert balance to float before saving
    const balanceFloat = Number(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if this is the workspace's first account
    const existingAccounts = await db.financialAccount.findMany({
      where: { workspaceId },
    });

    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If this account should be default, unset other default accounts in this workspace
    if (shouldBeDefault) {
      await db.financialAccount.updateMany({
        where: { workspaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account
    const account = await db.financialAccount.create({
      data: {
        name: data.name,
        type: data.type,
        workspaceId,
        balance: balanceFloat,
        isDefault: shouldBeDefault,
      },
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    return serializeDecimal(account);
  });
}

export async function getDashboardData(
  workspaceId: string,
): Promise<Transaction[]> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const transactions = await db.transaction.findMany({
      where: {
        workspaceId,
        workspace: { userId: user.id },
      },
      include: {
        financialAccount: {
          select: { id: true, name: true },
        },
        pocket: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    return transactions.map(serializeDecimal) as unknown as Transaction[];
  } catch (error) {
    return handleError(error);
  }
}
