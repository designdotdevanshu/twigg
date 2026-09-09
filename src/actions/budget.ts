"use server";

import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth";
import { db } from "@/server/db";

interface Budget {
  id: string;
  amount: number;
  lastAlertSent: Date | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCurrentUserBudgetResponse {
  budget: Budget | null;
  currentExpenses: number;
}

export async function getCurrentBudget(
  workspaceId: string,
  financialAccountId?: string,
): Promise<GetCurrentUserBudgetResponse> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("User not authenticated");

    const budget = await db.budget.findFirst({
      where: {
        workspaceId,
        workspace: { userId: user.id },
      },
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

    const whereClause: Record<string, unknown> = {
      workspaceId,
      workspace: { userId: user.id },
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    if (financialAccountId) {
      whereClause.financialAccountId = financialAccountId;
    }

    const expenses = await db.transaction.aggregate({
      where: whereClause,
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

export async function updateBudget(
  workspaceId: string,
  amount: number,
): Promise<{
  success: boolean;
  data?: Budget;
  error?: string;
}> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("User not authenticated");

    // Verify workspace ownership
    const ws = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });
    if (!ws) throw new Error("Workspace not found");

    const budget = await db.budget.upsert({
      where: { workspaceId },
      update: { amount },
      create: { workspaceId, amount },
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: (error as Error).message };
  }
}
