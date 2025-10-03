"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { asyncHandler } from "@/lib/utils";
import { getUserSession } from "@/lib/auth";
import { handleError, serializeDecimal } from "@/lib/utils";
import type { FinancialAccount } from "@prisma/client";

export async function getUserAccounts(): Promise<FinancialAccount[]> {
  try {
    const { id: userId } = await getUserSession();

    const accounts = await db.financialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Serialize accounts before sending to client
    return await Promise.all(accounts.map(serializeDecimal));
  } catch (error) {
    return handleError(error);
  }
}

export async function createAccount(data: FinancialAccount) {
  return asyncHandler(async function (): Promise<FinancialAccount> {
    const { id: userId } = await getUserSession();

    // Convert balance to float before saving
    const balanceFloat = Number(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if this is the user's first account
    const existingAccounts = await db.financialAccount.findMany({
      where: { userId },
    });

    // If it's the first account, make it default regardless of user input
    // If not, use the user's preference
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If this account should be default, unset other default accounts
    if (shouldBeDefault) {
      await db.financialAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account
    const account = await db.financialAccount.create({
      data: {
        ...data,
        userId,
        balance: balanceFloat,
        isDefault: shouldBeDefault, // Override the isDefault based on our logic
      },
    });

    // Serialize the account before returning
    const serializedAccount = serializeDecimal(account);

    revalidatePath("/dashboard");
    return serializedAccount;
  });
}
