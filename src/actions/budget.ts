"use server";

import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth";
import { db } from "@/server/db";

interface Budget {
  id: string;
  amount: number;
  lastAlertSent: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCurrentUserBudgetResponse {
  budget: Budget | null;
  currentExpenses: number;
}

export async function getCurrentBudget(
  financialAccountId: string,
): Promise<GetCurrentUserBudgetResponse> {
  try {
    const user = await getUserSession();

    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = user.id;

    const budget = await db.budget.findFirst({
      where: { userId },
    });

    // Get current month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        financialAccountId,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget(amount: number): Promise<{
  success: boolean;
  data?: Budget;
  error?: string;
}> {
  try {
    const user = await getUserSession();

    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = user.id;

    // Update or create budget
    const budget = await db.budget.upsert({
      where: { userId },
      update: { amount },
      create: { userId, amount },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: (error as Error).message };
  }
}
